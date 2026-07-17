import { io } from "socket.io-client";
import emitize from "./emitize";
import { query, mutate } from "./requests";
import axios from "axios";
import { API } from "./requests";
import debug from "./debug";
import { BASE_URL } from "./config";

const log = debug("shuleplus:data");

// Setup global debug state
window.__debugState = {
    requests: [],
    socketConnected: false,
    socketStatus: 'connecting',
    pingMs: 0
};
const emitDebug = () => window.dispatchEvent(new Event('debug_update'));

// Socket.IO configuration
// WebSockets MUST bypass the Netlify serverless proxy because serverless functions 
// do not support long-lived TCP connections. We connect directly to the true Kinsta backend.
const SOCKET_URL = "https://graph-ongyy.kinsta.app";
const socket = io(SOCKET_URL, {
    withCredentials: true,
    transports: ["websocket"],
    path: "/live"
});

// Calculate socket ping every 5 seconds
setInterval(() => {
    if (socket.connected) {
        const start = Date.now();
        socket.emit("ping", () => {
            window.__debugState.pingMs = Date.now() - start;
            emitDebug();
        });
    }
}, 5000);

// Authenticate socket on connection
socket.on("connect", () => {
    window.__debugState.socketConnected = true;
    window.__debugState.socketStatus = 'connected';
    emitDebug();
    const token = localStorage.getItem("token");
    if (token) {
        socket.emit("authenticate_socket", { token });
    }
});

socket.on("disconnect", () => {
    window.__debugState.socketConnected = false;
    window.__debugState.socketStatus = 'disconnected';
    emitDebug();
});

socket.on("connect_error", () => {
    window.__debugState.socketConnected = false;
    window.__debugState.socketStatus = 'disconnected';
    emitDebug();
});

socket.io.on("reconnect_attempt", () => {
    window.__debugState.socketStatus = 'connecting';
    emitDebug();
});

socket.io.on("reconnect_error", () => {
    window.__debugState.socketStatus = 'disconnected';
    emitDebug();
});

socket.io.on("reconnect_failed", () => {
    window.__debugState.socketStatus = 'disconnected';
    emitDebug();
});

// Centralized cache for all data entities, both flat and nested.
const allData = {
    // Top-level tree structure
    schools: [],
    // Flat lists for easy access and table views
    students: [],
    parents: [],
    buses: [],
    drivers: [],
    admins: [],
    routes: [],
    complaints: [],
    trips: [],
    events: [],
    schedules: [],
    classes: [],
    teachers: [],
    payments: [],
    charges: [],
    chargeTypes: [],
    feeStructures: [],
    grades: [],
    subjects: [],
    topics: [],
    subtopics: [],
    questions: [],
    options: [],
    teams: [],
    invitations: [],
    team_members: [],
    lessonAttempts: [],
    attemptEvents: [],
    smsEvents: [],
    smsLogs: [],
    books: [],
    assessmentTypes: [],
    assessmentRubrics: [],
    institutionalDeposits: [],
    scheme_of_works: [],
    record_of_works: [],
    lesson_plans: [],
    iep_templates: [],
    invoices: [],
    games: [],
    devices: [],
    device_commands: [],
    activityLogs: [],
    budgets: [],
    expenses: [],
};

// Centralized subscriptions object. Each key will hold an array of callbacks.
const subs = {};
let schoolID = undefined;
let isLoading = false;

const notifyLoading = (state) => {
    isLoading = state;
    if (Array.isArray(subs.loading)) {
        subs.loading.forEach(cb => cb({ loading: state }));
    }
};

/**
 * =================================================================
 * Real-Time Cache Injection System
 * =================================================================
 */
const injectOrUpdateEntity = (entityName, payload) => {
    if (!allData[entityName] || !Array.isArray(allData[entityName])) return;
    
    const index = allData[entityName].findIndex(item => String(item.id) === String(payload.id));
    if (index !== -1) {
        allData[entityName][index] = { ...allData[entityName][index], ...payload };
    } else {
        allData[entityName].push(payload);
    }
    
    // Notify subscribers
    if (Array.isArray(subs[entityName])) {
        const safeList = Array.isArray(allData[entityName]) ? allData[entityName] : [];
        subs[entityName].forEach(cb => cb({ [entityName]: [...safeList] }));
    }
};

// Listeners for WebSocket pushes from backend
socket.on("mutation_event", ({ entity, action, payload }) => {
    log(`WebSocket mutation event: [${action}] ${entity}`, payload);
    injectOrUpdateEntity(entity, payload);
});

/**
 * =================================================================
 * The Generic Entity API Factory (Safe Version)
 * =================================================================
 */
const createEntityAPI = (config) => {
    const {
        name,           // Plural name (e.g., "events")
        singularName,   // Singular name (e.g., "event")
        isNested = false,
        parentEntity = null, // e.g. "trips"
        parentKey = null,    // e.g. "trip"
        createFields = [],
        updateFields = [],
        returnFields = 'id',
    } = config;

    const filterPayload = (data, allowedFields) => {
        const filtered = {};
        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                filtered[field] = data[field];
            }
        }
        return filtered;
    };

    const findItemInTree = (itemId, startNodes = allData.schools) => {
        // Safety check: ensure startNodes is iterable
        if (!Array.isArray(startNodes)) return { item: null, parent: null, parentList: null };

        for (const node of startNodes) {
            if (String(node.id) === String(itemId)) return { item: node, parent: null, parentList: startNodes };
            const keysToRecurse = ['grades', 'subjects', 'topics', 'subtopics', 'questions', 'options', 'members', 'students', 'classes', 'buses', 'drivers', 'admins', 'parents', 'teachers', 'routes', 'schedules', 'trips', 'events', 'complaints', 'charges', 'payments', 'teams', 'invitations'];
            for (const key of keysToRecurse) {
                if (Array.isArray(node[key])) {
                    const found = findItemInTree(itemId, node[key]);
                    if (found.item) {
                        if (found.parent === null) {
                            found.parent = node;
                            found.parentList = node[key];
                        }
                        return found;
                    }
                }
            }
        }
        return { item: null, parent: null, parentList: null };
    };

    const notifySubscribers = (entity) => {
        if (Array.isArray(subs[entity])) {
            // FIX: Ensure we default to [] if allData[entity] is undefined
            const safeList = Array.isArray(allData[entity]) ? allData[entity] : [];
            const dataPayload = { [entity]: [...safeList] };
            subs[entity].forEach(cb => cb(dataPayload));
        }
    };

    const notifySchoolSubscribers = () => {
        if (Array.isArray(subs.schools)) {
            // FIX: Ensure we default to [] if allData.schools is undefined
            const safeSchools = Array.isArray(allData.schools) ? allData.schools : [];
            // FIX: Use String() comparison for safety
            const selectedSchool = safeSchools.find(s => String(s.id) === String(schoolID)) || {};
            subs.schools.forEach(cb => cb({ selectedSchool, schools: [...safeSchools] }));
        }
    };

    const api = {
        create: (data) => new Promise(async (resolve, reject) => {
            try {
                const payload = { ...data };
                // Ensure amount is string for GraphQL and handle both field variations
                if (payload.amount !== undefined && typeof payload.amount === 'number' && name !== 'chargeTypes' && !(name === 'feeStructures' && config.keepAmountAsNumber)) {
                    payload.amount = String(payload.amount);
                    payload.ammount = payload.amount; // Include both fields for React Native compatibility
                }
                if (payload.ammount !== undefined && typeof payload.ammount === 'number' && name !== 'chargeTypes' && !(name === 'feeStructures' && config.keepAmountAsNumber)) {
                    payload.ammount = String(payload.ammount);
                    payload.amount = payload.ammount; // Include both fields for React Native compatibility
                }
                if (!payload.school && name !== 'schools') {
                    payload.school = localStorage.getItem("school");
                }

                const sanitizedData = filterPayload(payload, createFields);
                const mutationName = `I${singularName}`;

                // 1. Perform Network Request
                const response = await mutate(
                    `mutation ($data: ${mutationName}!) { ${name} { create(${singularName}: $data) { ${returnFields} } } }`,
                    { data: sanitizedData }
                );

                if (!response[name] || !response[name].create) {
                    throw new Error(`Failed to create ${singularName}: No ID returned.`);
                }

                const createdItem = response[name].create;
                let newItem = { ...data, ...createdItem };

                // Normalization for assessments
                if (name === 'assessments') {
                    if (typeof newItem.student === 'string') newItem.student = { id: newItem.student };
                    if (typeof newItem.subject === 'string') newItem.subject = { id: newItem.subject };
                    if (typeof newItem.term === 'string') newItem.term = { id: newItem.term };
                    if (typeof newItem.assessmentType === 'string') newItem.assessmentType = { id: newItem.assessmentType };
                    if (typeof newItem.type === 'string') newItem.type = { id: newItem.type };
                }

                // 2. Safely Update Flat Cache
                if (!Array.isArray(allData[name])) {
                    allData[name] = [];
                }
                // CHECK FOR DUPLICATE BEFORE PUSHING
                if (!allData[name].some(item => String(item.id) === String(newItem.id))) {
                    allData[name].push(newItem);
                }

                // 3. Safely Update Nested Cache
                if (isNested && payload[parentKey]) {
                    const { item: parentItem } = findItemInTree(payload[parentKey]);
                    if (parentItem) {
                        if (!Array.isArray(parentItem[name])) parentItem[name] = [];
                        if (!parentItem[name].some(item => String(item.id) === String(newItem.id))) {
                            parentItem[name].push(newItem);
                        }
                    } else {
                        console.warn(`Could not find parent with ID ${payload[parentKey]} to append new ${singularName}`);
                    }
                } else {
                    const school = allData.schools.find(s => String(s.id) === String(payload.school));
                    if (school) {
                        if (!Array.isArray(school[name])) school[name] = [];
                        if (!school[name].some(item => String(item.id) === String(newItem.id))) {
                            school[name].push(newItem);
                        }
                    }
                }

                // 4. Notify Subscribers (Safe versions called)
                notifySubscribers(name);
                notifySchoolSubscribers();
                if (isNested) notifySubscribers(parentEntity);

                resolve(newItem);
            } catch (error) {
                console.error(`Error creating ${singularName}:`, error);
                reject(error);
            }
        }),

        update: (data) => new Promise(async (resolve, reject) => {
            try {
                const { id, ...payload } = data;
                // Ensure amount is string for GraphQL and handle both field variations
                if (payload.amount !== undefined && typeof payload.amount === 'number' && name !== 'chargeTypes' && !(name === 'feeStructures' && config.keepAmountAsNumber)) {
                    payload.amount = String(payload.amount);
                    payload.ammount = payload.amount; // Include both fields for React Native compatibility
                }
                if (payload.ammount !== undefined && typeof payload.ammount === 'number' && name !== 'chargeTypes' && !(name === 'feeStructures' && config.keepAmountAsNumber)) {
                    payload.ammount = String(payload.ammount);
                    payload.amount = payload.ammount; // Include both fields for React Native compatibility
                }
                const sanitizedPayload = filterPayload(payload, updateFields);
                const mutationName = `U${singularName}`;
                await mutate(
                    `mutation ($data: ${mutationName}!) { ${name} { update(${singularName}: $data) { id } } }`,
                    { data: { id, ...sanitizedPayload } }
                );

                // Normalization for specific entities like assessments
                let normalizedData = { ...data };
                if (name === 'assessments') {
                    if (typeof normalizedData.student === 'string') normalizedData.student = { id: normalizedData.student };
                    if (typeof normalizedData.subject === 'string') normalizedData.subject = { id: normalizedData.subject };
                    if (typeof normalizedData.term === 'string') normalizedData.term = { id: normalizedData.term };
                    if (typeof normalizedData.assessmentType === 'string') normalizedData.assessmentType = { id: normalizedData.assessmentType };
                    if (typeof normalizedData.type === 'string') normalizedData.type = { id: normalizedData.type };
                }

                const { item: itemInTree } = findItemInTree(id, allData.schools);
                if (itemInTree) Object.assign(itemInTree, normalizedData);

                if (Array.isArray(allData[name])) {
                    const itemIndexFlat = allData[name].findIndex(item => String(item.id) === String(id));
                    if (itemIndexFlat > -1) {
                        allData[name][itemIndexFlat] = { ...allData[name][itemIndexFlat], ...normalizedData };
                    }
                }

                notifySubscribers(name);
                notifySchoolSubscribers();
                if (isNested) notifySubscribers(parentEntity);
                resolve();
            } catch (error) {
                console.error(`Error updating ${singularName}:`, error);
                reject(error);
            }
        }),

        delete: (itemToDelete) => new Promise(async (resolve, reject) => {
            try {
                const { id } = itemToDelete;
                const mutationName = `U${singularName}`;
                await mutate(
                    `mutation ($data: ${mutationName}!) { ${name} { archive(${singularName}: $data) { id } } }`,
                    { data: { id } }
                );

                // Soft delete: mark as isDeleted instead of filtering out
                if (Array.isArray(allData[name])) {
                    const flatItem = allData[name].find(item => String(item.id) === String(id));
                    if (flatItem) flatItem.isDeleted = true;
                }

                const { item: itemInTree } = findItemInTree(id, allData.schools);
                if (itemInTree) {
                    itemInTree.isDeleted = true;
                }

                notifySubscribers(name);
                notifySchoolSubscribers();
                if (isNested) notifySubscribers(parentEntity);

                resolve();
            } catch (error) {
                console.error(`Error deleting ${singularName}:`, error);
                reject(error);
            }
        }),

        restore: (itemToRestore) => new Promise(async (resolve, reject) => {
            try {
                const { id } = itemToRestore;
                const mutationName = `U${singularName}`;
                await mutate(
                    `mutation ($data: ${mutationName}!) { ${name} { restore(${singularName}: $data) { id } } }`,
                    { data: { id } }
                );

                // Un-archive
                if (Array.isArray(allData[name])) {
                    const flatItem = allData[name].find(item => String(item.id) === String(id));
                    if (flatItem) flatItem.isDeleted = false;
                }

                const { item: itemInTree } = findItemInTree(id, allData.schools);
                if (itemInTree) {
                    itemInTree.isDeleted = false;
                }

                notifySubscribers(name);
                notifySchoolSubscribers();
                if (isNested) notifySubscribers(parentEntity);

                resolve();
            } catch (error) {
                console.error(`Error restoring ${singularName}:`, error);
                reject(error);
            }
        }),

        list: () => allData[name] || [],
        subscribe: (cb) => {
            if (!Array.isArray(subs[name])) {
                subs[name] = [];
            }
            subs[name].push(cb);
            // FIX: Ensure safe array spread here too
            cb({ [name]: allData[name] || [] });
            return () => {
                subs[name] = subs[name].filter(subscriber => subscriber !== cb);
            };
        },
        getOne: (id) => (allData[name] || []).find(item => item.id === id),
    };

    if (config.customMethods) {
        Object.assign(api, config.customMethods(allData, subs, api));
    }

    return api;
};


var Data = (function () {
    var instance;

    const init = () => {
        const FRAGMENT_USER_DATA = `fragment UserData on user { names email phone }`;
        const FRAGMENT_SCHOOL_DETAILS = `fragment schoolDetails on school { id name phone email address logo themeColor studentsCount parentsCount schoolSize schoolType schoolLevel numberOfStudents gradeOrder isDeleted inviteSmsText mpesaPaybill ratePerStudent }`;
        const FRAGMENT_GRADES_DATA = `fragment GradesData on school {
            grades { 
                id name subjectsOrder 
                subjects { 
                    id name teacher topicsOrder 
                    topics { 
                        id name icon subtopicOrder 
                        subtopics { 
                            id name questionsOrder 
                            questions { id name videos type contentOrder attachments optionsOrder } 
                        } 
                    } 
                } 
            }
            timeTableConfig
        }`;
        const FRAGMENT_PLANNING_DATA = `
  fragment PlanningData on school {
    grades {
      id
      name
      subjectsOrder
      subjects {
        id
        name
        teacher
        topicsOrder
        topics {
          id
          name
          icon
          subtopicOrder
          iep_templates(limit: 100, offset: 0) {
            id
            strand
            outcome
            experience
            resources
            methods
            initiationDate
            terminationDate
            reflection
            isDeleted
            student { id }
            term { id }
            teacher { id }
          }
          subtopics {
            id
            name
            questionsOrder
            scheme_of_works(limit: 100, offset: 0) {
              id
              subject { id }
              term { id }
              week
              lessonnumber
              strand
              substrands
              learningoutcomes
              keyenquiringquestions
              learningexperience
              corecompetencies
              valueslearnt
              learningresources
              assessment
              reflection
              createdAt
              updatedAt
              isDeleted
            }
            lesson_plans(limit: 100, offset: 0) {
              id
              subject { id }
              term { id }
              strand
              substrands
              learningoutcomes
              keyenquiringquestions
              learningresources
              introduction
              lessondevelopment
              conclusion
              extendedactivity
              reflection
              isDeleted
            }
            record_of_works(limit: 100, offset: 0) {
              id
              subject { id }
              term { id }
              week
              dateofteaching
              strand
              substrands
              learningoutcomes
              lessoncovered
              keyactivities
              assignments
              createdAt
              updatedAt
              isDeleted
            }
          }
        }
      }
    }
    timeTableConfig
  }
`;
        const FRAGMENT_GRADES_IMAGES_DATA = `fragment GradesImagesData on school {
            grades($id:String!) { id subjects { id teacher topics { id subtopics { id questions { id images } } } } }
        }`;
        const FRAGMENT_GRADES_OPTIONS_DATA = `fragment GradesOptionsData on school {
            grades { id subjects { id teacher topics { id subtopics { id questions { id options { id value correct } } } } } }
        }`;

        const FRAGMENT_LESSON_DATA = `fragment LessonData on school {
            grades {
                id
                subjects {
                    id
                    teacher
                    lessonAttempts {
                        id
                        lessonId
                        userId
                        startedAt
                        completedAt
                        status
                        finalScore
                        deviceInfo
                        attemptEvents {
                            id
                            questionId
                            eventType
                            eventTimestamp
                            userAnswer
                            metadata
                            isCorrect
                        }
                    }
                }
            } 
        }`;

        const FRAGMENT_TEAMS_DATA = `fragment TeamsData on school { teams { id name members { id name phone: maskedPhone email: maskedEmail gender } } }`;
        const FRAGMENT_INVITATIONS_DATA = `fragment InvitationsData on school { invitations { id message user email: maskedEmail phone: maskedPhone } }`;
        const FRAGMENT_FINANCIAL_DATA = `fragment FinancialData on school { 
            financial { balance, balanceFormated } 
            charges(limit: 5000) { amount reason time id parent { id name } chargeType { id name } term { id name } } 
            payments(limit: 5000) { 
                id 
                amount 
                phone 
                status
                mpesaReceiptNumber
                merchantRequestID
                checkoutRequestID
                resultCode
                resultDesc
                transactionDate
                errorMessage
                createdAt
                updatedAt
                metadata
                type 
                paymentType
                student { id names }
                ref 
                time 
            } 
        }`;
        const FRAGMENT_COMPLAINTS_DATA = `fragment ComplaintsData on school { complaints { id time content parent { id, name } } }`;
        const FRAGMENT_CHARGE_TYPES_DATA = `fragment ChargeTypesData on school { chargeTypes { id name description amount } }`;
        const FRAGMENT_FEE_STRUCTURES_DATA = `fragment FeeStructuresData on school { feeStructures { id feeType amount description isRequired isActive class { id name } term { id name startDate endDate } } }`;
        const FRAGMENT_STUDENTS_DATA = `fragment StudentsData on school { students(limit: 1000, offset: 0) { id names gender registration class { id, name, teacher { id, name } } route { id, name } parent { id, national_id, name } parent2 { id, national_id, name } balanceBroughtForward yearOfEntry profileImage } }`; 
        const FRAGMENT_BUSES_DATA = `fragment BusesData on school { buses { id plate make size driver { id, names } } }`;
        const FRAGMENT_DRIVERS_DATA = `fragment DriversData on school { drivers { id names phone: maskedPhone license_expiry licence_number: maskedLicenceNumber home } }`;
        const FRAGMENT_ADMINS_DATA = `fragment AdminsData on school { admins { id names email: maskedEmail phone: maskedPhone role schools { id } } }`;
        const FRAGMENT_PARENTS_DATA = `fragment ParentsData on school { parents(limit: 1000) { id national_id: maskedNationalId name gender email: maskedEmail phone: maskedPhone students { id, names, gender, route { id, name }, balanceBroughtForward } } }`;        const FRAGMENT_TEACHERS_DATA = `fragment TeachersData on school { teachers(limit: 1000) { id national_id: maskedNationalId tsc_number: maskedTscNumber name gender phone: maskedPhone email: maskedEmail classes { id, name } } }`;
        const FRAGMENT_CLASSES_DATA = `fragment ClassesData on school { classes(limit: 1000) { id name feeAmount grade { id name subjects { id } } students { id, names, gender, registration, parent { id, name, phone: maskedPhone }, parent2 { id, name }, route { id, name }, feeStatus { balance, balanceFormated }, balanceBroughtForward } teacher { id, name } } }`;
        const FRAGMENT_ROUTES_DATA = `fragment RoutesData on school { routes(limit: 1000) { id name description path { lat lng } } }`;
        const FRAGMENT_SCHEDULES_DATA = `fragment SchedulesData on school { schedules(limit: 1000) { id message time type end_time name days route { id, name } bus { id, make } } }`;
        const FRAGMENT_TRIPS_DATA = `fragment TripsData on school { trips(limit: 1000) { id startedAt isCancelled completedAt schedule { name id time end_time, route { id, name, students { id } } } bus { id, make, plate } driver { id, names } locReports { id time loc { lat lng } } events { time, type, student { id, names } } } }`;
        const FRAGMENT_TERMS_DATA = `fragment TermsData on school { terms { id name startDate endDate order } }`;
        const FRAGMENT_ASSESSMENT_TYPES_DATA = `fragment AssessmentTypesData on school { assessmentTypes { id name percentage order } }`;
        const FRAGMENT_ASSESSMENT_RUBRICS_DATA = `fragment AssessmentRubricsData on school { assessmentRubrics { id label minScore maxScore points teachersComment } }`;
        // 1. Define the Fragment for SMS History (Add this near other fragments)
        const FRAGMENT_SMS_EVENTS_DATA = `fragment SmsEventsData on school { 
    smsEvents { 
        id 
        messageTemplate 
        createdAt
        status 
        recipientCount 
        successCount 
        failureCount 
        providerResponse
        
        # The nested relation - individual SMS logs
        logs {
            id
            recipientName
            recipientPhone
            compiledMessage
            status
            error
            providerResponse # The raw JSON
        }
    } 
}`;
        const FRAGMENT_BOOKS_DATA = `fragment BooksData on school { books { id title author category tags coverUrl pdfUrl videoUrl type description isDeleted readsCount readEvents { id timestamp userId properties reader { id name role students { names } } } } }`;
        const FRAGMENT_GAMES_DATA = `fragment GamesData on school { games { id title developer category coverUrl gameUrl description isDeleted } }`;
        const FRAGMENT_DEVICES_DATA = `fragment DevicesData on school { devices { id macAddress status assignedStudent lastSeen osVersion batteryLevel isDeleted } }`;
        const FRAGMENT_DEVICE_COMMANDS_DATA = `fragment DeviceCommandsData on school { device_commands { id device command status payload isDeleted } }`;

        const deepMergeById = (target, source) => {
            for (const key in source) {
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    const sourceVal = source[key];
                    const targetVal = target[key];

                    if (Array.isArray(sourceVal)) {
                        if (!Array.isArray(targetVal)) { target[key] = []; }

                        sourceVal.forEach(sourceItem => {
                            if (typeof sourceItem === 'object' && sourceItem !== null && sourceItem.id) {
                                // Compare IDs as strings to handle numeric vs string ID mismatches
                                const existingItem = target[key].find(t => String(t.id) === String(sourceItem.id));
                                if (existingItem) {
                                    deepMergeById(existingItem, sourceItem);
                                } else {
                                    target[key].push(sourceItem);
                                }
                            } else {
                                if (typeof sourceItem !== 'object' && !target[key].includes(sourceItem)) {
                                    target[key].push(sourceItem);
                                } else if (typeof sourceItem === 'object') {
                                    target[key].push(sourceItem);
                                }
                            }
                        });
                    } else if (typeof sourceVal === 'object' && sourceVal !== null) {
                        if (typeof target[key] !== 'object' || target[key] === null) {
                            target[key] = {};
                        }
                        deepMergeById(target[key], sourceVal);
                    } else {
                        target[key] = sourceVal;
                    }
                }
            }
            return target;
        };

       const mergeAndNotify = (response) => {
            const incomingSchools = response?.schools;
            if (!incomingSchools || incomingSchools.length === 0) return;

            const updatedSubEntities = new Set();

            incomingSchools.forEach(incomingSchool => {
                // Use string comparison for school ID
                let school = allData.schools.find(s => String(s.id) === String(incomingSchool.id));
                if (!school) {
                    school = { id: incomingSchool.id };
                    allData.schools.push(school);
                    log("New School Added to cache:", school.id);
                }

                // UNIFY: If data comes in as 'curriculum' or 'planning', move it to 'grades'
                // so deepMergeById combines them into the same objects.
                if (incomingSchool.curriculum && !incomingSchool.grades) {
                    incomingSchool.grades = incomingSchool.curriculum;
                }
                if (incomingSchool.planning && !incomingSchool.grades) {
                    incomingSchool.grades = incomingSchool.planning;
                }

                deepMergeById(school, incomingSchool);

                Object.keys(incomingSchool).forEach(key => {
                    if (incomingSchool[key] !== null) {
                        updatedSubEntities.add(key);
                    }
                });

                // Trigger grades branch if any hierarchy alias was used
                if (incomingSchool.curriculum || incomingSchool.planning || incomingSchool.grades) {
                    updatedSubEntities.add('grades');
                }
            });

            if (!schoolID && allData.schools.length > 0) {
                schoolID = localStorage.getItem("school") || allData.schools[0].id;
                localStorage.setItem("school", schoolID);
            } else if (schoolID && schoolID !== localStorage.getItem("school")) {
                // If school changes, update schoolID
                schoolID = localStorage.getItem("school");
            }

            const activeSchool = allData.schools.find(s => String(s.id) === String(schoolID));
            if (!activeSchool) {
                console.warn("No activeSchool found for ID:", schoolID);
                return;
            }

            // Notify subscribers that school list/selection updated
            if (Array.isArray(subs.schools)) {
                subs.schools.forEach(cb => cb({
                    schools: [...allData.schools],
                    selectedSchool: activeSchool
                }));
            }

            // Notifier helper for flat lists
            const notifyEntity = (entityName, dataMapper) => {
                if (updatedSubEntities.has(entityName) && activeSchool[entityName]) {
                    const newData = dataMapper ? activeSchool[entityName].map(dataMapper) : activeSchool[entityName];
                    allData[entityName] = newData;
                    if (Array.isArray(subs[entityName])) {
                        subs[entityName].forEach(cb => cb({ [entityName]: [...allData[entityName]] }));
                    }
                }
            };

            // Call standard notifiers
            notifyEntity('students', s => ({
                ...s,
                parent_name: s.parent?.name,
                class_name: s.class?.name || allData.classes.find(c => String(c.id) === String(s.class?.id || s.class))?.name,
                route_name: s.route?.name,
                balanceBroughtForward: s.balanceBroughtForward
            }));
            notifyEntity('parents');
            notifyEntity('terms');
            notifyEntity('assessmentTypes');
            notifyEntity('assessmentRubrics');
            notifyEntity('drivers');
            notifyEntity('admins');
            notifyEntity('buses');
            notifyEntity('routes');
            notifyEntity('complaints');
            notifyEntity('trips');
            notifyEntity('teachers');
            notifyEntity('classes');
            notifyEntity('books');
            notifyEntity('chargeTypes');
            notifyEntity('games');
            notifyEntity('devices');
            notifyEntity('device_commands');

            // Financials Merge Logic
            if (updatedSubEntities.has('charges') || updatedSubEntities.has('payments')) {
                ['charges', 'payments'].forEach(entityName => {
                    if (updatedSubEntities.has(entityName)) {
                        const serverItems = activeSchool[entityName] || [];
                        const existingItems = allData[entityName] || [];
                        const existingMap = new Map(existingItems.map(p => [String(p.id), p]));
                        const mergedItems = [];

                        serverItems.forEach(serverItem => {
                            const existingItem = existingMap.get(String(serverItem.id));
                            mergedItems.push(existingItem ? { ...existingItem, ...serverItem } : serverItem);
                            existingMap.delete(String(serverItem.id));
                        });

                        mergedItems.push(...existingMap.values());
                        mergedItems.sort((a, b) => new Date(b.time || b.createdAt) - new Date(a.time || b.createdAt));
                        allData[entityName] = mergedItems;

                        if (Array.isArray(subs[entityName])) {
                            subs[entityName].forEach(cb => cb({ [entityName]: [...allData[entityName]] }));
                        }
                    }
                });
            }

            // UNIFIED HIERARCHY FLATTENING (Grades -> Subjects -> Topics -> Subtopics -> Questions -> Planning)
            if (updatedSubEntities.has('grades') && activeSchool.grades) {
                const activeGrades = activeSchool.grades.filter(g => !g.isDeleted);
                
                allData.grades = activeGrades;
                
                // Respect subjectsOrder when creating subjects flat list
                allData.subjects = activeGrades.flatMap(g => {
                    const subjects = g.subjects || [];
                    const subjectsOrder = g.subjectsOrder || [];
                    const orderedSubjects = [];
                    
                    // Add subjects in the specified order
                    subjectsOrder.forEach(subjectId => {
                        const subject = subjects.find(s => s.id === subjectId && !s.isDeleted);
                        if (subject) orderedSubjects.push({ ...subject, grade: g.id });
                    });
                    
                    // Add any remaining subjects not in the order
                    subjects.forEach(subject => {
                        if (!subjectsOrder.includes(subject.id) && !subject.isDeleted) {
                            orderedSubjects.push({ ...subject, grade: g.id });
                        }
                    });
                    
                    return orderedSubjects;
                });
                
                // Respect topicsOrder when creating topics flat list
                allData.topics = allData.subjects.flatMap(s => {
                    const topics = s.topics || [];
                    const topicsOrder = s.topicsOrder || [];
                    const orderedTopics = [];
                    
                    // Add topics in the specified order
                    topicsOrder.forEach(topicId => {
                        const topic = topics.find(t => t.id === topicId && !t.isDeleted);
                        if (topic) orderedTopics.push({ ...topic, subject: s.id });
                    });
                    
                    // Add any remaining topics not in the order
                    topics.forEach(topic => {
                        if (!topicsOrder.includes(topic.id) && !topic.isDeleted) {
                            orderedTopics.push({ ...topic, subject: s.id });
                        }
                    });
                    
                    return orderedTopics;
                });
                
                // Respect subtopicOrder when creating subtopics flat list
                allData.subtopics = allData.topics.flatMap(t => {
                    const subtopics = t.subtopics || [];
                    const subtopicOrder = t.subtopicOrder || [];
                    const orderedSubtopics = [];
                    
                    // Add subtopics in the specified order
                    subtopicOrder.forEach(subtopicId => {
                        const subtopic = subtopics.find(st => st.id === subtopicId && !st.isDeleted);
                        if (subtopic) orderedSubtopics.push({ ...subtopic, topic: t.id });
                    });
                    
                    // Add any remaining subtopics not in the order
                    subtopics.forEach(subtopic => {
                        if (!subtopicOrder.includes(subtopic.id) && !subtopic.isDeleted) {
                            orderedSubtopics.push({ ...subtopic, topic: t.id });
                        }
                    });
                    
                    return orderedSubtopics;
                });
                
                // Respect questionsOrder when creating questions flat list
                const questionsFromTree = allData.subtopics.flatMap(st => {
                    const questions = st.questions || [];
                    const questionsOrder = st.questionsOrder || [];
                    const orderedQuestions = [];
                    
                    // Add questions in the specified order
                    questionsOrder.forEach(questionId => {
                        const question = questions.find(q => q.id === questionId && !q.isDeleted);
                        if (question) orderedQuestions.push({ ...question, subtopic: st.id });
                    });
                    
                    // Add any remaining questions not in the order
                    questions.forEach(question => {
                        if (!questionsOrder.includes(question.id) && !question.isDeleted) {
                            orderedQuestions.push({ ...question, subtopic: st.id });
                        }
                    });
                    
                    return orderedQuestions;
                });
                
                if (questionsFromTree.length > 0) {
                    allData.questions = questionsFromTree;
                    
                    // Respect optionsOrder when creating options flat list
                    allData.options = allData.questions.flatMap(q => {
                        const options = q.options || [];
                        const optionsOrder = q.optionsOrder || [];
                        const orderedOptions = [];
                        
                        // Add options in the specified order
                        optionsOrder.forEach(optionId => {
                            const option = options.find(o => o.id === optionId && !o.isDeleted);
                            if (option) orderedOptions.push({ ...option, question: q.id });
                        });
                        
                        // Add any remaining options not in the order
                        options.forEach(option => {
                            if (!optionsOrder.includes(option.id) && !option.isDeleted) {
                                orderedOptions.push({ ...option, question: q.id });
                            }
                        });
                        
                        return orderedOptions;
                    });
                }

                // Flatten Planning items from Subtopics
                allData.scheme_of_works = allData.subtopics.flatMap(st => (st.scheme_of_works || []).filter(s => !s.isDeleted));
                allData.record_of_works = allData.subtopics.flatMap(st => (st.record_of_works || []).filter(r => !r.isDeleted));
                allData.lesson_plans = allData.subtopics.flatMap(st => (st.lesson_plans || []).filter(l => !l.isDeleted));
                allData.iep_templates = allData.topics.flatMap(t => (t.iep_templates || []).filter(i => !i.isDeleted));

                // ADD THIS LINE HERE:
                allData.lessonAttempts = allData.subjects.flatMap(s => s.lessonAttempts || []);
                
                // Flatten attemptEvents from lessonAttempts
                allData.attemptEvents = allData.lessonAttempts.flatMap(la => la.attemptEvents || []);

                // Notify all tree-based subscribers
                ['grades', 'subjects', 'topics', 'subtopics', 'questions', 'options', 'scheme_of_works', 'record_of_works', 'lesson_plans', 'iep_templates', 'lessonAttempts', 'attemptEvents'].forEach(name => {
                    if (Array.isArray(subs[name])) {
                        subs[name].forEach(cb => cb({ [name]: [...allData[name]] }));
                    }
                });
            }

            if (updatedSubEntities.has('smsEvents') && activeSchool.smsEvents) {
                allData.smsEvents = activeSchool.smsEvents;
                
                // Flatten smsLogs from smsEvents
                allData.smsLogs = allData.smsEvents.flatMap(se => se.logs || []);
                
                if (Array.isArray(subs.smsEvents)) {
                    subs.smsEvents.forEach(cb => cb({ smsEvents: [...allData.smsEvents] }));
                }
                if (Array.isArray(subs.smsLogs)) {
                    subs.smsLogs.forEach(cb => cb({ smsLogs: [...allData.smsLogs] }));
                }
            }

            if (updatedSubEntities.has('feeStructures') && activeSchool.feeStructures) {
                allData.feeStructures = activeSchool.feeStructures;
                if (Array.isArray(subs.feeStructures)) {
                    subs.feeStructures.forEach(cb => cb({ feeStructures: [...allData.feeStructures] }));
                }
            }

        };

        const queries = [
            { query: `query GetschoolsAndUser { user { ...UserData } schools(limit: 1000) { ...schoolDetails } }${FRAGMENT_USER_DATA}${FRAGMENT_SCHOOL_DETAILS}` },
            { query: `query GetStudents { schools { id ...StudentsData } } ${FRAGMENT_STUDENTS_DATA}` },
            { query: `query GetParents { schools { id ...ParentsData } } ${FRAGMENT_PARENTS_DATA}` },
            { query: `query GetClasses { schools { id ...ClassesData } } ${FRAGMENT_CLASSES_DATA}` }, // Classes moved up to prioritize loading
            { query: `query GetFinancials { schools { id ...FinancialData } } ${FRAGMENT_FINANCIAL_DATA}` },
            { query: `query GetDrivers { schools { id ...DriversData } } ${FRAGMENT_DRIVERS_DATA}` },
            { query: `query GetAdmins { schools { id ...AdminsData } } ${FRAGMENT_ADMINS_DATA}` },
            { query: `query GetBuses { schools { id ...BusesData } } ${FRAGMENT_BUSES_DATA}` },
            { query: `query GetRoutes { schools { id ...RoutesData } } ${FRAGMENT_ROUTES_DATA}` },
            { query: `query GetSchedules { schools { id ...SchedulesData } } ${FRAGMENT_SCHEDULES_DATA}` },
            { query: `query GetChargeTypes { schools { id ...ChargeTypesData } } ${FRAGMENT_CHARGE_TYPES_DATA}` },
            { query: `query GetFeeStructures { schools { id ...FeeStructuresData } } ${FRAGMENT_FEE_STRUCTURES_DATA}` },
            { query: `query GetTrips { schools { id ...TripsData } } ${FRAGMENT_TRIPS_DATA}` },
            { query: `query GetComplaints { schools { id ...ComplaintsData } } ${FRAGMENT_COMPLAINTS_DATA}` },
            { query: `query GetTeachers { schools { id ...TeachersData } } ${FRAGMENT_TEACHERS_DATA}` },
            { query: `query GetTeams { schools { id ...TeamsData } } ${FRAGMENT_TEAMS_DATA}` },
            { query: `query GetInvitations { schools { id ...InvitationsData } } ${FRAGMENT_INVITATIONS_DATA}` },
            { query: `query GetGradesBase { schools { id ...GradesData } } ${FRAGMENT_GRADES_DATA}` },
            { query: `query GetPlanning { schools { id ...PlanningData } } ${FRAGMENT_PLANNING_DATA}` }, { query: `query GetGradesOptions { schools { id ...GradesOptionsData } } ${FRAGMENT_GRADES_OPTIONS_DATA}` },
            { query: `query GetLessonAttempts { schools { id ...LessonData } } ${FRAGMENT_LESSON_DATA}` },
            { query: `query GetSmsEvents { schools { id ...SmsEventsData } } ${FRAGMENT_SMS_EVENTS_DATA}` },
            { query: `query GetBooks { schools { id ...BooksData } } ${FRAGMENT_BOOKS_DATA}` },
            { query: `query GetGames { schools { id ...GamesData } } ${FRAGMENT_GAMES_DATA}` },
            { query: `query GetDevices { schools { id ...DevicesData } } ${FRAGMENT_DEVICES_DATA}` },
            { query: `query GetDeviceCommands { schools { id ...DeviceCommandsData } } ${FRAGMENT_DEVICE_COMMANDS_DATA}` },
            { query: `query GetTerms { schools { id ...TermsData } } ${FRAGMENT_TERMS_DATA}` },
            { query: `query GetAssessmentTypes { schools { id ...AssessmentTypesData } } ${FRAGMENT_ASSESSMENT_TYPES_DATA}` },
            { query: `query GetAssessmentRubrics { schools { id ...AssessmentRubricsData } } ${FRAGMENT_ASSESSMENT_RUBRICS_DATA}` },

        ];

        // Skip all network requests if there's no auth token — no point firing
        // 25 requests that are guaranteed to 401 before the redirect kicks in.
        if (!localStorage.getItem("authorization")) {
            console.warn("[Data] No auth token found. Skipping data fetch.");
            return;
        }

        notifyLoading(true);
        const promises = queries.map(({ query: qStr, variables = {} }) => {
            return query(qStr, variables)
                .then((response) => mergeAndNotify(response))
                .catch(err => {
                    if (err?.response?.status !== 401) {
                        console.error("GraphQL Query Failed:", err);
                    }
                });
        });

        Promise.allSettled(promises).then(() => {
            notifyLoading(false);
        });
        
        // Fetch activity logs separately since they are not school-specific
        query(`query { activityLogs { id entity action userTitle userId before after createdAt } }`)
            .then(res => {
                if (res && res.activityLogs) {
                    allData.activityLogs = res.activityLogs;
                    if (Array.isArray(subs.activityLogs)) {
                        subs.activityLogs.forEach(cb => cb({ activityLogs: [...allData.activityLogs] }));
                    }
                }
            })
            .catch(err => console.error("Failed to fetch activity logs", err));
    };

    init();

    const entityConfigs = [
        { name: "grades", singularName: "grade", createFields: ['name', 'school', 'subjectsOrder', 'isvisible'], updateFields: ['name', 'school', 'subjectsOrder', 'isvisible'] },
        { name: "subjects", singularName: "subject", isNested: true, parentEntity: "grades", parentKey: "grade", createFields: ['name', 'grade', 'topicsOrder', 'teacher', 'aiGeneratedCurriculum', 'topicalImages'], updateFields: ['name', 'grade', 'topicsOrder', 'teacher', 'aiGeneratedCurriculum', 'topicalImages'] },
        { name: "topics", singularName: "topic", isNested: true, parentEntity: "subjects", parentKey: "subject", createFields: ['name', 'subject', 'icon', 'subtopicOrder', 'isvisible'], updateFields: ['name', 'subject', 'icon', 'subtopicOrder', 'isvisible'] },
        { name: "subtopics", singularName: "subtopic", isNested: true, parentEntity: "topics", parentKey: "topic", createFields: ['name', 'topic', 'questionsOrder', 'isTimed', 'startDate', 'startTime', 'endTime'], updateFields: ['name', 'topic', 'questionsOrder', 'isTimed', 'startDate', 'startTime', 'endTime'] },
        { name: "questions", singularName: "question", isNested: true, parentEntity: "subtopics", parentKey: "subtopic", createFields: ['name', 'type', 'subtopic', 'videos', 'attachments', 'images', 'optionsOrder', 'contentOrder'], updateFields: ['name', 'type', 'subtopic', 'videos', 'attachments', 'images', 'optionsOrder', 'contentOrder'], customMethods: (allData, subs, api) => ({ getImages: (id) => new Promise(async (resolve, reject) => { try { const response = await query(`query GetQuestionImages($id: String!) { questionImages(id: $id) }`, { id }); resolve(response.questionImages || []); } catch (e) { console.error(e); resolve([]); } }) }) },
        { name: "options", singularName: "option", isNested: true, parentEntity: "questions", parentKey: "question", createFields: ['value', 'correct', 'question'], updateFields: ['value', 'correct', 'question'] },
        { name: "options", singularName: "option", isNested: true, parentEntity: "questions", parentKey: "question", createFields: ['value', 'correct', 'question'], updateFields: ['value', 'correct', 'question'] },
        {
            name: "assessments",
            singularName: "assessment",
            createFields: ['student', 'term', 'subject', 'assessmentType', 'score', 'outOf', 'teacher', 'school', 'remarks', 'teachersComment'],
            updateFields: ['score', 'remarks', 'teachersComment'],
            customMethods: (allData, subs, api) => ({
                getForClass: (classId, termId) => new Promise(async (resolve, reject) => {
                    try {
                        const schoolId = localStorage.getItem("school");
                        const queryStr = `
                            query GetClassAssessments($schoolId: String, $classId: String, $termId: String) {
                                school(id: $schoolId) {
                                    assessments(class: $classId, term: $termId) {
                                        id score outOf remarks teachersComment
                                        student { id class { id } }
                                        subject { id }
                                        term { id }
                                        assessmentType { id }
                                    }
                                }
                            }
                        `;
                        const response = await query(queryStr, { schoolId, classId, termId });
                        const fetchedAssessments = response.school?.assessments || [];

                        // Merge into local cache
                        const safeList = Array.isArray(allData.assessments) ? allData.assessments : [];
                        // We need to be careful not to duplicate.
                        // Ideally we replace or merge. 
                        // Since this is a fresh fetch for a context, maybe we just upsert.

                        fetchedAssessments.forEach(newAss => {
                            const existingIdx = safeList.findIndex(a => String(a.id) === String(newAss.id));
                            // Normalize references for the flat cache
                            const flatAss = {
                                ...newAss,
                                student: {
                                    id: newAss.student?.id || newAss.student,
                                    class: newAss.student?.class?.id || newAss.student?.class
                                },
                                subject: newAss.subject?.id || newAss.subject,
                                term: newAss.term?.id || newAss.term,
                                assessmentType: newAss.assessmentType?.id || newAss.assessmentType
                            };

                            if (existingIdx > -1) {
                                safeList[existingIdx] = { ...safeList[existingIdx], ...flatAss };
                            } else {
                                safeList.push(flatAss);
                            }
                        });
                        log(`Assessments getForClass: fetched ${fetchedAssessments.length}, total in cache ${safeList.length}`);

                        // Update cache ref (if it wasn't already)
                        if (!Array.isArray(allData.assessments)) allData.assessments = safeList;

                        // Notify subscribers
                        if (Array.isArray(subs.assessments)) {
                            subs.assessments.forEach(cb => cb({ assessments: [...allData.assessments] }));
                        }

                        resolve(fetchedAssessments);
                    } catch (e) {
                        console.error("Failed to fetch assessments:", e);
                        reject(e);
                    }
                }),
                bulkSave: (assessmentsData) => new Promise(async (resolve, reject) => {
                    if (!assessmentsData || assessmentsData.length === 0) return resolve([]);
                    try {
                        const mutation = `
                            mutation BulkSaveAssessments($data: [BulkAssessmentInput]!) {
                                assessments {
                                    bulkSave(assessments: $data) {
                                        id score outOf remarks teachersComment
                                        student { id class { id } }
                                        subject { id }
                                        term { id }
                                        assessmentType { id }
                                    }
                                }
                            }
                        `;
                        // Ensure all data is correctly formatted
                        const payload = assessmentsData.map(a => ({
                            id: a.id,
                            student: typeof a.student === 'object' ? a.student.id : a.student,
                            term: typeof a.term === 'object' ? a.term.id : a.term,
                            subject: typeof a.subject === 'object' ? a.subject.id : a.subject,
                            assessmentType: a.assessmentType || a.type,
                            score: parseFloat(a.score),
                            outOf: parseFloat(a.outOf || 100),
                            teachersComment: a.teachersComment || a.comment,
                            school: a.school || localStorage.getItem("school"),
                            remarks: a.remarks || a.remark
                        }));

                        const response = await mutate(mutation, { data: payload });
                        const savedAssessments = response.assessments?.bulkSave || [];

                        // Merge into local cache
                        const safeList = Array.isArray(allData.assessments) ? allData.assessments : [];

                        savedAssessments.forEach(newAss => {
                            const existingIdx = safeList.findIndex(a => String(a.id) === String(newAss.id));
                            const flatAss = {
                                ...newAss,
                                student: {
                                    id: newAss.student?.id || newAss.student,
                                    class: newAss.student?.class?.id || newAss.student?.class
                                },
                                subject: newAss.subject?.id || newAss.subject,
                                term: newAss.term?.id || newAss.term,
                                assessmentType: newAss.assessmentType?.id || newAss.assessmentType
                            };

                            if (existingIdx > -1) {
                                safeList[existingIdx] = { ...safeList[existingIdx], ...flatAss };
                            } else {
                                safeList.push(flatAss);
                            }
                        });

                        if (!Array.isArray(allData.assessments)) allData.assessments = safeList;

                        if (Array.isArray(subs.assessments)) {
                            subs.assessments.forEach(cb => cb({ assessments: [...allData.assessments] }));
                        }

                        resolve(savedAssessments);
                    } catch (e) {
                        console.error("Failed to bulk save assessments:", e);
                        reject(e);
                    }
                }),
                getForStudent: (studentId) => new Promise(async (resolve, reject) => {
                    try {
                        const schoolId = localStorage.getItem("school");
                        const queryStr = `
                            query GetStudentAssessments($schoolId: String, $studentId: String) {
                                school(id: $schoolId) {
                                    assessments(student: $studentId) {
                                        id score outOf remarks teachersComment
                                        student { id class { id } }
                                        subject { id }
                                        term { id }
                                        assessmentType { id }
                                    }
                                }
                            }
                        `;
                        const response = await query(queryStr, { schoolId, studentId });
                        const fetchedAssessments = response.school?.assessments || [];

                        // Merge into local cache
                        const safeList = Array.isArray(allData.assessments) ? allData.assessments : [];

                        fetchedAssessments.forEach(newAss => {
                            const existingIdx = safeList.findIndex(a => String(a.id) === String(newAss.id));
                            const flatAss = {
                                ...newAss,
                                student: {
                                    id: newAss.student?.id || newAss.student,
                                    class: newAss.student?.class?.id || newAss.student?.class
                                },
                                subject: newAss.subject?.id || newAss.subject,
                                term: newAss.term?.id || newAss.term,
                                assessmentType: newAss.assessmentType?.id || newAss.assessmentType
                            };

                            if (existingIdx > -1) {
                                safeList[existingIdx] = { ...safeList[existingIdx], ...flatAss };
                            } else {
                                safeList.push(flatAss);
                            }
                        });

                        if (!Array.isArray(allData.assessments)) allData.assessments = safeList;

                        if (Array.isArray(subs.assessments)) {
                            subs.assessments.forEach(cb => cb({ assessments: [...allData.assessments] }));
                        }

                        resolve(fetchedAssessments);
                    } catch (e) {
                        console.error("Failed to fetch student assessments:", e);
                        reject(e);
                    }
                })
            })
        },
        {
            name: "students",
            singularName: "student",
            createFields: ['names', 'route', 'gender', 'registration', 'parent', 'school', 'parent2', 'class', 'paidFees', 'balanceBroughtForward'],
            updateFields: ['names', 'route', 'registration', 'gender', 'parent', 'parent2', 'class', 'balanceBroughtForward'],
            returnFields: 'id names gender registration class { id name } route { id name } parent { id name } parent2 { id name } balanceBroughtForward',
            customMethods: (allData, subs) => ({
                getPage: async ({ page = 1, limit = 15, search = "" }) => {
                    const offset = (page - 1) * limit;
                    const response = await query(`query GetStudentPage($limit: Int, $offset: Int, $id: String, $search: String) { school(id: $id) { studentsCount(search: $search) students(limit: $limit, offset: $offset, search: $search) { id names gender registration class{id, name} route{id, name} parent{id, name} balanceBroughtForward  } } }`, { limit, offset, id: localStorage.getItem("school"), search });
                    const processedStudents = response.school?.students?.map(s => ({ ...s, parent_name: s.parent?.name, class_name: s.class?.name })) || [];
                    return { students: processedStudents, totalCount: response.school?.studentsCount || 0 };
                },
                upgrade: async (studentData) => {
                    try {
                        const { id, ...updateData } = studentData;
                        const response = await mutate(
                            `mutation ($data: Ustudent!) { 
                                students { 
                                    upgrade(student: $data) { 
                                        id 
                                    } 
                                } 
                            }`,
                            { data: { id, ...updateData } }
                        );

                        // Update local cache
                        const studentIndex = allData.students.findIndex(s => String(s.id) === String(id));
                        if (studentIndex > -1) {
                            Object.assign(allData.students[studentIndex], updateData);
                        }

                        // Notify subscribers
                        if (Array.isArray(subs.students)) {
                            subs.students.forEach(cb => cb({ students: [...allData.students] }));
                        }

                        return response;
                    } catch (error) {
                        console.error('Failed to upgrade student:', error);
                        throw error;
                    }
                }
            })
        },
        {
            name: "parents",
            singularName: "parent",
            createFields: ['name', 'national_id', 'phone', 'email', 'school', 'password', 'gender'],
            updateFields: ['national_id', 'name', 'phone', 'password', 'email', 'gender'],
            customMethods: (allData, subs) => ({
                getPage: async ({ page = 1, limit = 15, search = "" }) => {
                    const offset = (page - 1) * limit;
                    const response = await query(`query GetParentPage($limit: Int, $offset: Int, $id: String, $search: String) { school(id: $id) { parentsCount(search: $search) parents(limit: $limit, offset: $offset, search: $search) { id national_id name gender email phone students { names gender route { name } } } } }`, { limit, offset, id: localStorage.getItem("school"), search });
                    return { parents: response.school?.parents || [], totalCount: response.school?.parentsCount || 0 };
                },
                invite: (data) => new Promise(async (resolve) => {
                    const response = await mutate(`mutation ($data: Iinvite!) { parents { invite(parent: $data) { id phone message } } }`, { data });
                    const invitation = response.parents.invite;
                    allData.invitations.push(invitation);
                    if (Array.isArray(subs.invitations)) subs.invitations.forEach(cb => cb({ invitations: [...allData.invitations] }));
                    resolve(invitation);
                }),
                // --- ADDED METHODS BELOW ---
                getForClass: (classId) => {
                    // 1. Find the class to get its list of student IDs
                    const targetClass = allData.classes.find(c => String(c.id) === String(classId));
                    if (!targetClass || !Array.isArray(targetClass.students)) return [];

                    // 2. Create a Set of student IDs for O(1) lookup
                    const studentIds = new Set(targetClass.students.map(s => s.id));

                    // 3. Filter parents who have a child in that Set
                    return allData.parents.filter(p =>
                        Array.isArray(p.students) && p.students.some(s => {
                            // Convert to string for set lookup
                            return studentIds.has(String(s.id));
                        })
                    );
                },
                getForRoute: (routeId) => {
                    // The parents data fragment already includes nested route data for students
                    return allData.parents.filter(p =>
                        Array.isArray(p.students) && p.students.some(s => s.route && String(s.route.id) === String(routeId))
                    );
                }
            })
        },
        {
            name: "smsLogs",
            singularName: "smsLog",
            // Read-only usually, so create/update fields might be minimal
            createFields: [],
            updateFields: []
        },
        { name: "smsEvents", singularName: "smsEvent", createFields: [], updateFields: [] },
        { name: "drivers", singularName: "driver", createFields: ['names', 'phone', 'username', 'email', 'license_expiry', 'licence_number', 'home', 'school', 'experience', 'bus'], updateFields: ['names', 'phone', 'username', 'email', 'license_expiry', 'licence_number', 'home', 'experience', 'bus'], customMethods: (allData, subs, api) => ({ invite: (data) => new Promise(async (resolve) => { const response = await mutate(`mutation ($data: Iinvite!) { drivers { invite(driver: $data) { id phone message } } }`, { data }); const invitation = response.drivers.invite; allData.invitations.push(invitation); if (Array.isArray(subs.invitations)) subs.invitations.forEach(cb => cb({ invitations: [...allData.invitations] })); resolve(invitation); }), transfer: (data) => new Promise(async (resolve) => { await mutate(`mutation ($data: Itransfer!) { drivers { transfer(driver: $data) { id } } }`, { data }); init(); resolve(); }) }) },
        { name: "admins", singularName: "admin", createFields: ['names', 'phone', 'school', 'email', 'password', 'role', 'schools'], updateFields: ['names', 'phone', 'email', 'password', 'role', 'schools'], customMethods: (allData, subs) => ({ invite: (data) => new Promise(async (resolve) => { const response = await mutate(`mutation ($data: Iinvite!) { admins { invite(admin: $data) { id phone message } } }`, { data }); const invitation = response.admins.invite; allData.invitations.push(invitation); if (Array.isArray(subs.invitations)) subs.invitations.forEach(cb => cb({ invitations: [...allData.invitations] })); resolve(invitation); }) }) },
        { name: "buses", singularName: "bus", createFields: ['make', 'plate', 'size', 'school', 'driver'], updateFields: ['make', 'plate', 'size', 'driver'] },
        { name: "routes", singularName: "route", createFields: ['name', 'description', 'school', 'students', 'path'], updateFields: ['name', 'description', 'students', 'path'] },
        { name: "schedules", singularName: "schedule", createFields: ['name', 'message', 'time', 'end_time', 'school', 'route', 'type', 'days', 'bus', 'driver', 'actions'], updateFields: ['name', 'message', 'time', 'end_time', 'type', 'days', 'route', 'bus', 'driver', 'actions'] },
        { name: "activityLogs", singularName: "activityLog", createFields: [], updateFields: [] },
        { 
            name: "classes", 
            singularName: "class", 
            createFields: ['name', 'teacher', 'school', 'order', 'grade'], 
            updateFields: ['name', 'teacher', 'order', 'grade'],
            customMethods: (allData, subs, api) => ({
                updateOrder: (orders) => new Promise(async (resolve, reject) => {
                    if (!orders || orders.length === 0) return resolve(true);
                    try {
                        const mutation = `
                            mutation UpdateClassOrder($orders: [ClassOrderInput]!) {
                                classes {
                                    updateOrder(orders: $orders)
                                }
                            }
                        `;
                        const response = await mutate(mutation, { orders });

                        // Update cache locally
                        const safeList = Array.isArray(allData.classes) ? allData.classes : [];
                        orders.forEach(({ id, order }) => {
                            const existing = safeList.find(c => String(c.id) === String(id));
                            if (existing) existing.order = order;
                        });

                        allData.classes = [...safeList].sort((a, b) => (a.order || 0) - (b.order || 0));

                        if (Array.isArray(subs.classes)) {
                            subs.classes.forEach(cb => cb({ classes: [...allData.classes] }));
                        }

                        resolve(response);
                    } catch (e) {
                        console.error('Failed to update class orders:', e);
                        reject(e);
                    }
                })
            })
        },
        { name: "teachers", singularName: "teacher", createFields: ['name', 'national_id', 'tsc_number', 'phone', 'email', 'school', 'gender', 'password'], updateFields: ['national_id', 'tsc_number', 'name', 'phone', 'email', 'gender', 'password'], customMethods: (allData, subs) => ({ invite: (data) => new Promise(async (resolve) => { const response = await mutate(`mutation ($data: Iinvite!) { teachers { invite(teacher: $data) { id phone message } } }`, { data }); const invitation = response.teachers.invite; allData.invitations.push(invitation); if (Array.isArray(subs.invitations)) subs.invitations.forEach(cb => cb({ invitations: [...allData.invitations] })); resolve(invitation); }) }) },
        { name: "teams", singularName: "team", createFields: ['name', 'school'], updateFields: ['name', 'school'], customMethods: (allData, subs) => ({ invite: (data) => new Promise(async (resolve) => { const response = await mutate(`mutation ($data: Iinvite!) { teams { invite(team: $data) { id phone message } } }`, { data }); const invitation = response.teams.invite; allData.invitations.push(invitation); if (Array.isArray(subs.invitations)) subs.invitations.forEach(cb => cb({ invitations: [...allData.invitations] })); resolve(invitation); }) }) },
        { name: "team_members", singularName: "team_member", createFields: ['team', 'user'], updateFields: ['team', 'user'] },
        { name: "complaints", singularName: "complaint", createFields: ['parent', 'school', 'content', 'time'], updateFields: ['parent', 'content', 'time'] },
        { name: "trips", singularName: "trip", createFields: ['startedAt', 'completedAt', 'isCancelled', 'school', 'driver', 'schedule'], updateFields: ['startedAt', 'completedAt', 'isCancelled', 'schedule'] },
        {
            name: "events",
            singularName: "event",
            isNested: true,
            parentEntity: "trips",
            parentKey: "trip",
            // REPLACE createFields with this:
            createFields: ['school', 'title', 'description', 'startTime', 'endTime', 'type', 'student', 'time', 'trip'],
            updateFields: ['school', 'title', 'description', 'startTime', 'endTime', 'type', 'time']
        }, {
            name: "payments",
            singularName: "payment",
            createFields: ['school', 'phone', 'amount', 'type', 'ref', 'time', 'status', 'description', 'student', 'paymentType', 'metadata', 'resultDesc', 'resultCode'],
            updateFields: ['phone', 'amount', 'type', 'ref', 'time', 'status', 'description', 'student', 'paymentType', 'metadata', 'resultDesc', 'resultCode']
        }, {
            name: "charges",
            singularName: "charge",
            createFields: ['school', 'amount', 'reason', 'time', 'parent', 'student', 'chargeType', 'term'],
            updateFields: ['amount', 'reason', 'time', 'parent', 'student', 'chargeType', 'term']
        }, {
            name: "feeStructures",
            singularName: "feeStructure",
            createFields: ['school', 'class', 'term', 'feeType', 'amount', 'description', 'isRequired', 'isActive'],
            updateFields: ['class', 'term', 'feeType', 'amount', 'description', 'isRequired', 'isActive'],
            customMethods: (allData, subs, api) => ({
                findByClass: (classId, termId) => new Promise(async (resolve, reject) => {
                    try {
                        const schoolId = localStorage.getItem("school");
                        const response = await query(`
                            query GetFeeStructuresByClass($schoolId: String!, $classId: String!, $termId: String) {
                                school(id: $schoolId) {
                                    feeStructures(where: {
                                        class: $classId,
                                        term: $termId
                                    }) {
                                        id
                                        feeType
                                        amount
                                        description
                                        isRequired
                                        isActive
                                        class { id name }
                                        term { id name startDate endDate }
                                    }
                                }
                            }
                        `, {
                            schoolId,
                            classId,
                            termId
                        });
                        
                        resolve(response.school?.feeStructures || []);
                    } catch (error) {
                        console.error('Failed to fetch fee structures by class:', error);
                        reject(error);
                    }
                }),
                bulkCreate: (feeStructuresData) => new Promise(async (resolve, reject) => {
                    try {
                        const response = await api(`
                            mutation BulkCreateFeeStructures($feeStructures: [IfeeStructure!]!) {
                                feeStructures {
                                    bulkCreate(feeStructures: $feeStructures) {
                                        id
                                        feeType
                                        amount
                                        description
                                        isRequired
                                        isActive
                                        class { id name }
                                        term { id name }
                                    }
                                }
                            }
                        `, {
                            feeStructures: feeStructuresData
                        });
                        
                        resolve(response.feeStructures?.bulkCreate || []);
                    } catch (error) {
                        console.error('Failed to bulk create fee structures:', error);
                        reject(error);
                    }
                })
            })
        }, { name: "invitations", singularName: "invitation", createFields: ['school', 'user', 'message', 'phone', 'email'], updateFields: ['school', 'user', 'message', 'phone', 'email'] },
        {
            name: "lessonAttempts",
            singularName: "lessonAttempt",
            createFields: ['lessonId', 'userId', 'startedAt', 'completedAt', 'status', 'finalScore', 'deviceInfo', 'school'],
            updateFields: ['id', 'lessonId', 'userId', 'startedAt', 'completedAt', 'status', 'finalScore', 'deviceInfo', 'school'],
            customMethods: (allData, subs, api) => ({
                getCrossSchoolAttemptsBySchool: async (schoolId, subjectId) => {
                    try {
                        // Query to get lesson attempts across all schools based on the active schoolId
                        const queryStr = `
                            query GetCrossSchoolLessonAttempts($schoolId: String!, $subjectId: String!) {
                                crossSchoolLessonAttempts(schoolId: $schoolId, subjectId: $subjectId) {
                                    id
                                    lessonId
                                    userId
                                    startedAt
                                    completedAt
                                    status
                                    finalScore
                                    deviceInfo
                                    school {
                                        id
                                        name
                                    }
                                    attemptEvents {
                                        id
                                        questionId
                                        eventType
                                        eventTimestamp
                                        userAnswer
                                        metadata
                                        isCorrect
                                    }
                                    parent {
                                        id
                                        name
                                        phone
                                        school {
                                            id
                                            name
                                        }
                                    }
                                }
                            }
                        `;
                        
                        const response = await query(queryStr, { schoolId, subjectId });
                        return response.crossSchoolLessonAttempts || [];
                    } catch (error) {
                        console.error('Error fetching cross-school lesson attempts:', error);
                        return [];
                    }
                }
            })
        },
        {
            name: "attemptEvents",
            singularName: "attemptEvent",
            isNested: true,
            parentEntity: "lessonAttempts",
            parentKey: "lessonAttempt",
            createFields: ['lessonAttempt', 'questionId', 'eventType', 'school', 'eventTimestamp', 'userAnswer', 'metadata', 'isCorrect'],
            updateFields: ['id', 'lessonAttempt', 'questionId', 'eventType', 'school', 'eventTimestamp', 'userAnswer', 'metadata', 'isCorrect']
        },
        {
            name: "terms",
            singularName: "term",
            createFields: ['name', 'school', 'startDate', 'endDate', 'order'],
            updateFields: ['name', 'school', 'startDate', 'endDate', 'order'],
            customMethods: (allData, subs, api) => ({
                updateOrder: (orders) => new Promise(async (resolve, reject) => {
                    if (!orders || orders.length === 0) return resolve(true);
                    try {
                        const mutation = `
                            mutation UpdateTermOrder($orders: [TermOrderInput]!) {
                                terms {
                                    updateOrder(orders: $orders)
                                }
                            }
                        `;
                        const response = await mutate(mutation, { orders });

                        // Store term order in localStorage as fallback
                        localStorage.setItem('termOrders', JSON.stringify(orders));

                        // Update cache locally
                        const safeList = Array.isArray(allData.terms) ? allData.terms : [];
                        orders.forEach(({ id, order }) => {
                            const existing = safeList.find(a => String(a.id) === String(id));
                            if (existing) existing.order = order;
                        });

                        allData.terms = [...safeList].sort((a, b) => (a.order || 0) - (b.order || 0));

                        if (Array.isArray(subs.terms)) {
                            subs.terms.forEach(cb => cb({ terms: [...allData.terms] }));
                        }

                        resolve(response);
                    } catch (e) {
                        console.error('Failed to update term orders:', e);
                        reject(e);
                    }
                })
            })
        },
        {
            name: "books",
            singularName: "book",
            createFields: ['title', 'author', 'category', 'tags', 'coverUrl', 'pdfUrl', 'videoUrl', 'type', 'description', 'school'],
            updateFields: ['title', 'author', 'category', 'tags', 'coverUrl', 'pdfUrl', 'videoUrl', 'type', 'description']
        },
        {
            name: "assessmentTypes",
            singularName: "assessmenttype",
            createFields: ['name', 'percentage', 'school', 'order'],
            updateFields: ['name', 'percentage', 'order'],
            customMethods: (allData, subs, api) => ({
                updateOrder: (orders) => new Promise(async (resolve, reject) => {
                    if (!orders || orders.length === 0) return resolve(true);
                    try {
                        const mutation = `
                            mutation UpdateAssessmentTypeOrder($orders: [AssessmentTypeOrderInput]!) {
                                assessmentTypes {
                                    updateOrder(orders: $orders)
                                }
                            }
                        `;
                        const response = await mutate(mutation, { orders });

                        // Update cache locally
                        const safeList = Array.isArray(allData.assessmentTypes) ? allData.assessmentTypes : [];
                        orders.forEach(({ id, order }) => {
                            const existing = safeList.find(a => String(a.id) === String(id));
                            if (existing) existing.order = order;
                        });

                        allData.assessmentTypes = [...safeList].sort((a, b) => (a.order || 0) - (b.order || 0));

                        if (Array.isArray(subs.assessmentTypes)) {
                            subs.assessmentTypes.forEach(cb => cb({ assessmentTypes: [...allData.assessmentTypes] }));
                        }

                        resolve(response);
                    } catch (e) {
                        console.error('Failed to update assessmentType orders:', e);
                        reject(e);
                    }
                })
            })
        },
        {
            name: "assessmentRubrics",
            singularName: "assessmentrubric",
            createFields: ['label', 'minScore', 'maxScore', 'points', 'teachersComment', 'school'],
            updateFields: ['label', 'minScore', 'maxScore', 'points', 'teachersComment']
        },
        {
            name: "chargeTypes",
            singularName: "chargeType",
            createFields: ['school', 'name', 'description', 'amount'],
            updateFields: ['name', 'description', 'amount']
        },
        {
            name: "feeStructures",
            singularName: "feeStructure",
            createFields: ['school', 'feeType', 'amount', 'description', 'class', 'term', 'isRequired', 'isActive'],
            updateFields: ['feeType', 'amount', 'description', 'class', 'term', 'isRequired', 'isActive'],
            keepAmountAsNumber: true,
            customMethods: (allData, subs) => ({
                getPage: async ({ page = 1, limit = 15, search = "" }) => {
                    const offset = (page - 1) * limit;
                    const response = await query(`query GetFeeStructurePage($limit: Int, $offset: Int, $id: String, $search: String) { school(id: $id) { feeStructures(limit: $limit, offset: $offset, search: $search) { id feeType amount description isRequired isActive class { id name } term { id name } } } }`, { limit, offset, id: localStorage.getItem("school"), search });
                    const feeStructures = response.school?.feeStructures || [];
                    // For pagination, we need to get total count. If there's no count field, we'll fetch all for search or use a reasonable default
                    let totalCount = feeStructures.length;
                    if (search) {
                        // For search, get all results to count them
                        const allResponse = await query(`query GetAllFeeStructures($id: String, $search: String) { school(id: $id) { feeStructures(search: $search) { id } } }`, { id: localStorage.getItem("school"), search });
                        totalCount = allResponse.school?.feeStructures?.length || 0;
                    } else {
                        // For non-search, estimate based on current page + whether we got full results
                        totalCount = feeStructures.length < limit ? (page - 1) * limit + feeStructures.length : page * limit + 1;
                    }
                    return { feeStructures, totalCount };
                }
            })
        },
        {
            name: "institutionalDeposits",
            singularName: "institutionalDeposit",
            createFields: ['school', 'amount', 'depositorName', 'paymentMethod', 'purpose', 'status', 'metadata'],
            updateFields: ['amount', 'depositorName', 'paymentMethod', 'purpose', 'status', 'metadata'],
            customMethods: (allData, subs, api) => ({
                getPage: (params = {}) => new Promise(async (resolve, reject) => {
                    try {
                        const { page = 1, limit = 15, sort = { key: 'createdAt', direction: 'descending' } } = params;
                        const schoolId = localStorage.getItem("school");

                        // Use the existing payments from allData (already loaded from initial queries)
                        const allPayments = Data.payments.list() || [];

                        // Filter payments to identify institutional deposits
                        const institutionalDeposits = allPayments.filter(payment => {
                            const metadata = payment.metadata || {};
                            return metadata.type === 'institutional_deposit' ||
                                metadata.purpose === 'institutional_deposit' ||
                                payment.type === 'institutional_deposit' ||
                                payment.paymentType === 'institutional_deposit';
                        }).map(payment => ({
                            ...payment,
                            depositorName: payment.metadata?.depositorName || 'Institutional Deposit',
                            paymentMethod: payment.paymentType || 'mpesa',
                            purpose: payment.metadata?.purpose || 'institutional_deposit',
                            receiptNumber: payment.mpesaReceiptNumber || `INST-${payment.id}`,
                            status: payment.status === 'COMPLETED' ? 'completed' : 'pending'
                        }));

                        // Apply pagination
                        const startIndex = (page - 1) * limit;
                        const endIndex = startIndex + limit;
                        const paginatedDeposits = institutionalDeposits.slice(startIndex, endIndex);

                        resolve({
                            deposits: paginatedDeposits,
                            totalCount: institutionalDeposits.length
                        });
                    } catch (error) {
                        console.error('Failed to fetch institutional deposits:', error);
                        reject(error);
                    }
                }),
                createWithMpesa: (depositData) => new Promise(async (resolve, reject) => {
                    try {
                        const schoolId = localStorage.getItem("school");
                        const { amount, phone, depositorName, purpose = 'institutional_deposit' } = depositData;

                        // Use existing M-Pesa payment system with institutional metadata
                        const mpesaResponse = await Data.schools.charge(phone, amount, {
                            type: 'institutional_deposit',
                            depositorName,
                            purpose,
                            paymentType: 'institutional_deposit'
                        }, schoolId);

                        resolve({
                            mpesaInit: mpesaResponse.payments?.init,
                            metadata: {
                                type: 'institutional_deposit',
                                depositorName,
                                purpose
                            }
                        });
                    } catch (error) {
                        console.error('Failed to create institutional M-Pesa payment:', error);
                        reject(error);
                    }
                }),
                isInstitutionalPayment: (payment) => {
                    const metadata = payment.metadata || {};
                    return metadata.type === 'institutional_deposit' ||
                        metadata.purpose === 'institutional_deposit' ||
                        payment.type === 'institutional_deposit' ||
                        payment.paymentType === 'institutional_deposit';
                }
            })
        },
        {
            name: "scheme_of_works",
            singularName: "scheme_of_work",
            isNested: true,
            parentEntity: "subtopics",
            parentKey: "substrands",
            createFields: ['school', 'subject', 'subtopic', 'term', 'teacher', 'week', 'lessonnumber', 'strand', 'substrands', 'learningoutcomes', 'keyenquiringquestions', 'learningexperience', 'corecompetencies', 'learningresources', 'assessment', 'reflection'],
            updateFields: ['term', 'teacher', 'week', 'lessonnumber', 'strand', 'substrands', 'learningoutcomes', 'keyenquiringquestions', 'learningexperience', 'corecompetencies', 'learningresources', 'assessment', 'reflection']
        },
        {
            name: "record_of_works",
            singularName: "record_of_work",
            isNested: true,
            parentEntity: "subtopics",
            parentKey: "substrands",
            createFields: ['school', 'subject', 'subtopic', 'term', 'teacher', 'week', 'dateofteaching', 'strand', 'substrands', 'learningoutcomes', 'lessoncovered', 'keyactivities', 'assignments'],
            updateFields: ['term', 'teacher', 'week', 'dateofteaching', 'strand', 'substrands', 'learningoutcomes', 'lessoncovered', 'keyactivities', 'assignments']
        },
        {
            name: "lesson_plans",
            singularName: "lesson_plan",
            isNested: true,
            parentEntity: "subtopics",
            parentKey: "substrands",
            createFields: ['school', 'subject', 'subtopic', 'term', 'teacher', 'strand', 'substrands', 'learningoutcomes', 'keyenquiringquestions', 'learningresources', 'introduction', 'lessondevelopment', 'conclusion', 'extendedactivity', 'reflection'],
            updateFields: ['term', 'teacher', 'strand', 'substrands', 'learningoutcomes', 'keyenquiringquestions', 'learningresources', 'introduction', 'lessondevelopment', 'conclusion', 'extendedactivity', 'reflection']
        },
        {
            name: "iep_templates",
            singularName: "iep_template",
            isNested: true,
            parentEntity: "topics",
            parentKey: "strand",
            createFields: ['school', 'student', 'strand', 'substrands', 'strengths', 'needs', 'outcome', 'experience', 'resources', 'methods', 'initiationDate', 'terminationDate', 'reflection'],
            updateFields: ['student', 'strand', 'substrands', 'strengths', 'needs', 'outcome', 'experience', 'resources', 'methods', 'initiationDate', 'terminationDate', 'reflection']
        },
        {
            name: "invoices",
            singularName: "invoice",
            createFields: ['school', 'amount', 'description', 'status', 'dueDate', 'createdDate'],
            updateFields: ['id', 'school', 'amount', 'description', 'status', 'dueDate', 'paymentMethod', 'paymentIdentifier', 'confirmedBy', 'confirmedDate'],
            customMethods: (allData, subs, api) => ({
                getInvoices: (params = {}) => new Promise(async (resolve, reject) => {
                    try {
                        const { school, status } = params;
                        const queryStr = `
                            query GetInvoices($school: String, $status: String) {
                                invoices(school: $school, status: $status) {
                                    id amount description status dueDate createdDate paymentMethod paymentIdentifier confirmedBy confirmedDate
                                    school { id name }
                                }
                            }
                        `;
                        const response = await query(queryStr, { school, status });
                        const fetchedInvoices = response.invoices || [];
                        
                        // Update cache
                        allData.invoices = fetchedInvoices;
                        if (Array.isArray(subs.invoices)) {
                            subs.invoices.forEach(cb => cb({ invoices: [...allData.invoices] }));
                        }
                        
                        resolve(fetchedInvoices);
                    } catch (error) {
                        console.error('Failed to fetch invoices:', error);
                        reject(error);
                    }
                })
            })
        },
        {
            name: "games",
            singularName: "game",
            createFields: ['title', 'developer', 'category', 'coverUrl', 'gameUrl', 'description', 'school'],
            updateFields: ['title', 'developer', 'category', 'coverUrl', 'gameUrl', 'description']
        },
        {
            name: "devices",
            singularName: "device",
            createFields: ['macAddress', 'status', 'assignedStudent', 'osVersion', 'batteryLevel', 'school'],
            updateFields: ['macAddress', 'status', 'assignedStudent', 'lastSeen', 'osVersion', 'batteryLevel']
        },
        {
            name: "device_commands",
            singularName: "device_command",
            createFields: ['device', 'command', 'status', 'payload', 'school'],
            updateFields: ['device', 'command', 'status']
        },
        {
            name: "budgets",
            singularName: "budget",
            createFields: ['school', 'title', 'amount', 'startDate', 'endDate', 'description'],
            updateFields: ['school', 'title', 'amount', 'startDate', 'endDate', 'description']
        },
        {
            name: "expenses",
            singularName: "expense",
            createFields: ['school', 'title', 'amount', 'date', 'category', 'receiptImage', 'budget', 'description'],
            updateFields: ['school', 'title', 'amount', 'date', 'category', 'receiptImage', 'budget', 'description']
        }
    ];
    const generatedApis = {};
    entityConfigs.forEach(config => {
        generatedApis[config.name] = createEntityAPI(config);
    });

    instance = {
        loading: {
            subscribe: (callback) => {
                if (!subs.loading) subs.loading = [];
                subs.loading.push(callback);
                // Trigger immediately with current state
                callback({ loading: isLoading });
                return () => { subs.loading = subs.loading.filter(cb => cb !== callback); };
            }
        },
        ...generatedApis,
        init,
        auth: {
            login: (id) => ({}),
            getUser: (id) => ({}),
            logout: (id, data) => { },
        },
        user: {
            getOne: () => ({}),
        },
        communication: {
            sms: {
                create: sms => {
                    const formattedSms = {
                        school: sms.school || localStorage.getItem("school") || "",
                        message: sms.message,
                        parents: sms.parents || (sms.phone ? [sms.phone] : [])
                    };
                    return mutate(`mutation SendSMS($sms: Isms!) {
                        sms {
                            send(sms: $sms) {
                            success
                            message
                            sentCount
                            failedCount
                            successfulSends {
                                parentId
                                phone
                            }
                            failedSends {
                                parentId
                                phone
                                error
                            }
                            }
                        }
                    }`, { sms: formattedSms });
                },
                sendOTP: async (phoneNumber) => {
                    try {
                        const response = await axios.post(`${API}/auth/otp/send`, { 
                            user: phoneNumber 
                        });
                        return {
                            success: response.data && (response.data.success || response.status < 300),
                            message: response.data?.message || "OTP sent successfully",
                            data: response.data
                        };
                    } catch (error) {
                        console.error('Failed to send OTP:', error);
                        return {
                            success: false,
                            message: error.response?.data?.message || error.message || "Failed to send OTP",
                            error: error
                        };
                    }
                },
                verifyOTP: async (phoneNumber, otpCode) => {
                    try {
                        const response = await axios.post(`${API}/auth/verify/sms`, { 
                            user: phoneNumber,
                            password: otpCode
                        });
                        return {
                            success: response.data && (response.data.success || response.status < 300),
                            message: response.data?.message || "OTP verified successfully",
                            data: response.data
                        };
                    } catch (error) {
                        console.error('Failed to verify OTP:', error);
                        return {
                            success: false,
                            message: error.response?.data?.message || error.message || "Failed to verify OTP",
                            error: error
                        };
                    }
                }
            }
        },
        schools: {
            setSchool: (id) => {
                schoolID = id;
                localStorage.setItem("school", id);
                
                // Clear flat cache for all entities except schools
                Object.keys(allData).forEach(key => {
                    if (key !== 'schools') {
                        allData[key] = [];
                    }
                });
                
                // Re-trigger all initial data queries for the new school context
                init();
                
                // Manually trigger a notification to school subscribers so UI updates immediately
                if (Array.isArray(subs.schools)) {
                    const safeSchools = Array.isArray(allData.schools) ? allData.schools : [];
                    const activeSchool = safeSchools.find(s => String(s.id) === String(id)) || {};
                    subs.schools.forEach(cb => cb({
                        schools: [...safeSchools],
                        selectedSchool: activeSchool
                    }));
                }
            },
            list: () => allData.schools,
            subscribe: (cb) => {
                if (!Array.isArray(subs.schools)) { subs.schools = []; }
                subs.schools.push(cb);
                const currentSchoolId = schoolID || localStorage.getItem("school");
                const selectedSchool = allData.schools.find(s => String(s.id) === String(currentSchoolId));
                cb({ schools: [...allData.schools], selectedSchool: selectedSchool || {} });
                return () => {
                    subs.schools = subs.schools.filter(subscriber => subscriber !== cb);
                };
            },
            update: (data) => new Promise(async (resolve, reject) => {
                try {
                    const { id, ...payload } = data;
                    const response = await mutate(`mutation ($data: USchool!) { schools { update(school: $data) { id } } }`, { data: { id, ...payload } });
                    const itemIndexFlat = allData.schools.findIndex(item => String(item.id) === String(id));
                    if (itemIndexFlat > -1) { 
                      allData.schools[itemIndexFlat] = { ...allData.schools[itemIndexFlat], ...data }; 
                    }
                    const updatedSchool = allData.schools[itemIndexFlat];
                    if (Array.isArray(subs.schools)) {
                        const selectedSchool = allData.schools.find(s => String(s.id) === String(schoolID));
                        subs.schools.forEach(cb => cb({ schools: [...allData.schools], selectedSchool: selectedSchool || {} }));
                    }
                    resolve(updatedSchool);
                } catch (error) { console.error(`Error updating school:`, error); reject(error); }
            }),
            create: (data) => new Promise(async (resolve, reject) => {
                try {
                    const response = await mutate(`mutation ($data: ISchool!) { schools { create(school: $data) { id } } }`, { data });
                    const newSchool = { ...data, id: response.schools.create.id };
                    allData.schools.push(newSchool);
                    if (Array.isArray(subs.schools)) {
                        const selectedSchool = allData.schools.find(s => String(s.id) === String(schoolID));
                        subs.schools.forEach(cb => cb({ schools: [...allData.schools], selectedSchool: selectedSchool || {} }));
                    }
                    resolve(newSchool);
                } catch (error) { console.error(`Error creating school:`, error); reject(error); }
            }),
            getSelected: () => {
                const currentSchoolId = localStorage.getItem("school");
                return allData.schools.find(s => String(s.id) === String(currentSchoolId)) || {};
            },
            delete: (school) => instance.schools.archive(school),
            archive: (schoolToDelete) => new Promise(async (resolve, reject) => {
                try {
                    const school = schoolToDelete || instance.schools.getSelected();
                    if (!school.id) return reject("No school selected");
                    await mutate(`mutation ($data: USchool!) { schools { archive(school: $data) { id } } }`, { data: { id: school.id } });
                    
                    // Soft delete: mark as isDeleted instead of filtering out
                    const cachedSchool = allData.schools.find(s => String(s.id) === String(school.id));
                    if (cachedSchool) cachedSchool.isDeleted = true;
                    
                    if (Array.isArray(subs.schools)) {
                        const selectedSchool = allData.schools.find(s => String(s.id) === String(schoolID));
                        subs.schools.forEach(sCb => sCb({ schools: [...allData.schools], selectedSchool: selectedSchool || {} }));
                    }
                    resolve(cachedSchool);
                } catch (error) {
                    console.error("Error archiving school:", error);
                    reject(error);
                }
            }),
            restore: (schoolToRestore) => new Promise(async (resolve, reject) => {
                try {
                    const { id } = schoolToRestore;
                    await mutate(`mutation ($data: USchool!) { schools { restore(school: $data) { id } } }`, { data: { id } });
                    
                    // Un-archive
                    const cachedSchool = allData.schools.find(s => String(s.id) === String(id));
                    if (cachedSchool) cachedSchool.isDeleted = false;
                    
                    if (Array.isArray(subs.schools)) {
                        const selectedSchool = allData.schools.find(s => String(s.id) === String(schoolID));
                        subs.schools.forEach(sCb => sCb({ schools: [...allData.schools], selectedSchool: selectedSchool || {} }));
                    }
                    resolve(cachedSchool);
                } catch (error) {
                    console.error("Error restoring school:", error);
                    reject(error);
                }
            }),
            charge: (phone, amount, metadata = {}, forcedSchoolId) => {
                const schoolId = forcedSchoolId || instance.schools.getSelected()?.id;
                if (!schoolId) return Promise.reject("No school selected");
                return mutate(`mutation ($payment: mpesaStartTxInput!) { payments { init(payment: $payment){ id, CheckoutRequestID, MerchantRequestID } } }`, {
                    payment: {
                        schoolId,
                        amount: String(amount),
                        ammount: String(amount), // Also provide the misspelled one just in case
                        phone,
                        metadata
                    }
                }).then(response => {
                    const initRes = response.payments?.init;
                    if (initRes) {
                        // Manually inject into cache for immediate UI update
                        const newPayment = {
                            id: initRes.id,
                            amount: String(amount),
                            phone: phone,
                            status: 'PENDING',
                            merchantRequestID: initRes.MerchantRequestID,
                            checkoutRequestID: initRes.CheckoutRequestID,
                            createdAt: new Date().toISOString(),
                            metadata: {
                                ...metadata,
                                termId: metadata.termId || localStorage.getItem('fees_selectedTerm') // Persist current term context
                            },
                            type: 'mpesa_init',
                            student: metadata.studentId
                        };
                        if (!Array.isArray(allData.payments)) allData.payments = [];
                        allData.payments.push(newPayment);

                        // Also find school in cache and add it there
                        const school = allData.schools.find(s => String(s.id) === String(schoolId));
                        if (school) {
                            if (!Array.isArray(school.payments)) school.payments = [];
                            school.payments.push(newPayment);
                        }

                        // Notify
                        if (Array.isArray(subs.payments)) {
                            subs.payments.forEach(cb => cb({ payments: [...allData.payments] }));
                        }
                    }
                    return response;
                });
            },
            // In utils/data.js (inside publicApi -> school object)

            verifyTx: ({ CheckoutRequestID, MerchantRequestID, schoolId: forcedId }) => {
                const schoolId = forcedId || instance.schools.getSelected()?.id;
                if (!schoolId) return Promise.reject("No school selected for verification");

                return mutate(
                    `mutation ($data: mpesaStartTxVerificationInput!) { 
            payments { 
                confirm(payment: $data) { 
    success
    message
    id
    amount
    phone
    status
    mpesaReceiptNumber
    resultDesc
    ref
    time 
}
            } 
        }`,
                    {
                        data: {
                            MerchantRequestID: MerchantRequestID,
                            CheckoutRequestID: CheckoutRequestID,
                            schoolId: schoolId
                        }
                    }
                ).then(response => {
                    const confirmRes = response.payments?.confirm;
                    if (confirmRes && confirmRes.success) {
                        // Update cache
                        const payment = allData.payments.find(p => String(p.id) === String(confirmRes.id) || String(p.checkoutRequestID) === String(CheckoutRequestID));
                        if (payment) {
                            Object.assign(payment, {
                                status: confirmRes.status || 'COMPLETED',
                                mpesaReceiptNumber: confirmRes.mpesaReceiptNumber,
                                resultDesc: confirmRes.resultDesc,
                                ref: confirmRes.ref,
                                time: confirmRes.time
                            });

                            // Notify
                            if (Array.isArray(subs.payments)) {
                                subs.payments.forEach(cb => cb({ payments: [...allData.payments] }));
                            }
                        }
                    }
                    return response;
                });
            },
        },
        timeTables: {
            getAll: async () => {
                const schoolId = localStorage.getItem("school");
                const response = await query(`query GetTimeTables($schoolId: String!) {
                    school(id: $schoolId) {
                        timeTables {
                            id
                            class { id name }
                            day
                            time
                            subject { id name }
                            teacher { id name }
                            createdAt
                            updatedAt
                        }
                    }
                }`, { schoolId });
                return response.school?.timeTables || [];
            },
            getByClass: async (classId) => {
                const schoolId = localStorage.getItem("school");
                const response = await query(`query GetClassTimeTable($schoolId: String!, $classId: String!) {
                    school(id: $schoolId) {
                        timeTables(class: $classId) {
                            id
                            class { id name }
                            day
                            time
                            subject { id name }
                            teacher { id name }
                            createdAt
                            updatedAt
                        }
                    }
                }`, { schoolId, classId });
                
                const timeTableData = {};
                const timeTables = response.school?.timeTables || [];
                timeTables.forEach(tt => {
                    const key = `${tt.day}-${tt.time}`;
                    timeTableData[key] = {
                        subject: tt.subject,
                        teacher: tt.teacher,
                        class: tt.class,
                        day: tt.day,
                        time: tt.time,
                        id: tt.id
                    };
                });
                return timeTableData;
            },
            save: async (classId, gridData) => {
                const schoolId = localStorage.getItem("school");
                const allocations = Object.values(gridData).map(item => ({
                    day: item.day,
                    time: item.time,
                    subject: item.subject?.id || item.subject,
                    teacher: item.teacher?.id || item.teacher,
                    class: classId,
                    school: schoolId
                }));
                
                return mutate(`mutation BulkSaveTimeTable($allocations: [TimeTableInput]!) { timeTables { bulkSave(allocations: $allocations) { success message } } }`, { allocations });
            },
            saveConfig: async (config) => {
                const id = localStorage.getItem("school");
                return mutate(`mutation UpdateSchoolConfig($school: USchool!) { school { update(school: $school) { id timeTableConfig } } }`, { 
                    school: { id, timeTableConfig: config } 
                });
            },
            getTeacherAvailability: async (teacherId, day, time) => {
                const schoolId = localStorage.getItem("school");
                const response = await query(`query GetTeacherAvailability($schoolId: String!, $teacherId: String!, $day: String!, $time: String!) {
                    school(id: $schoolId) {
                        teacherAvailability(teacherId: $teacherId, day: $day, time: $time) {
                            available
                            conflict {
                                id
                                class { id name }
                                day
                                time
                                subject { id name }
                            }
                        }
                    }
                }`, { schoolId, teacherId, day, time });
                
                return response.school?.teacherAvailability || { available: true };
            },
            getTeacherAllocations: async (teacherId) => {
                const schoolId = localStorage.getItem("school");
                const response = await query(`query GetTeacherAllocations($schoolId: String!, $teacherId: String!) {
                    school(id: $schoolId) {
                        teacherAllocations(teacherId: $teacherId) {
                            id
                            class { id name }
                            day
                            time
                            subject { id name }
                        }
                    }
                }`, { schoolId, teacherId });
                
                return response.school?.teacherAllocations || [];
            }
        },
        localMdm: {
            auth: async (payload) => {
                const res = await fetch("http://localhost:18205/api/auth", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) throw new Error("Local auth failed");
                return true;
            },
            getDevices: async () => {
                const res = await fetch("http://localhost:18205/api/devices");
                if (res.status === 503) throw new Error("adb_not_found");
                if (!res.ok) throw new Error("Local service disconnected");
                const data = await res.json();
                
                if (!data.devices && typeof data === 'object' && !Array.isArray(data)) {
                    // New Rust tool returns a flat HashMap
                    return data;
                } else if (Array.isArray(data.devices)) {
                    // Very old tool returned array of strings
                    const mapped = {};
                    data.devices.forEach(serial => {
                        mapped[serial] = { stats: {}, progress: '', battery: '' };
                    });
                    return mapped;
                }
                
                return data.devices || {};
            },
            onboard: async (serial) => {
                const res = await fetch("http://localhost:18205/api/onboard", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ serial })
                });
                if (!res.ok) throw new Error("Onboard failed");
                return true;
            },
            setup: async () => {
                const res = await fetch("http://localhost:18205/api/setup", { method: "POST" });
                if (!res.ok) throw new Error("Setup failed");
                return true;
            },
            connectLogs: (onMessage, onError) => {
                const eventSource = new EventSource("http://localhost:18205/api/logs");
                eventSource.onmessage = onMessage;
                eventSource.onerror = onError;
                return eventSource;
            }
        },
        mdm: {
            getApkInfo: async (apiBase) => {
                const res = await fetch(`${apiBase}/apk-info?t=${Date.now()}`, { cache: "no-store" });
                if (!res.ok) throw new Error("Failed to fetch APK info");
                return await res.json();
            },
            getToolInfo: async () => {
                const res = await fetch(`https://graph-ongyy.kinsta.app/uploads/tool-info.json?t=${Date.now()}`, { cache: "no-store" });
                if (!res.ok) throw new Error("Failed to fetch tool info");
                return await res.json();
            }
        },
    };

    return {
        getInstance: function () {
            return instance;
        }
    };
})();

export default Data.getInstance();