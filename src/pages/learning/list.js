import React from "react";
import Data from "../../utils/data";
import moment from "moment"; // Moment.js for "time ago" functionality
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // import styles

// Import all the real modal components
import AddGradeModal from "./grades/add";
import EditGradeModal from "./grades/edit"; 
import DeleteGradeModal from "./grades/delete";
import AddSubjectModal from "./subjects/add";
import EditSubjectModal from "./subjects/edit";
import DeleteSubjectModal from "./subjects/delete";
import AddTopicModal from "./topics/add";
import EditTopicModal from "./topics/edit";
import DeleteTopicModal from "./topics/delete";
import AddSubtopicModal from "./subtopics/add";
import EditSubtopicModal from "./subtopics/edit";
import DeleteSubtopicModal from "./subtopics/delete";
import AddQuestionModal from "./questions/add";
import EditQuestionModal from "./questions/edit";
import DeleteQuestionModal from "./questions/delete";
import AddOptionModal from "./options/add";
import EditOptionModal from "./options/edit";
import DeleteOptionModal from "./options/delete";

// Import the rich-media Table component
import Table from "./components/table";
import PlanningPrintView from "./components/PlanningPrintView";

// --- Components for Reports ---
import Navbar from "../../components/navbar";
import Subheader from "../../components/subheader";

// --- Helper Components ---
const Search = ({ onSearch, value, title }) => (
    <div className="cm-search-wrapper">
        <i className="la la-search search-icon"></i>
        <input type="text" className="form-control cm-search-input" placeholder={`Search ${title}...`} value={value || ''} onChange={onSearch} />
    </div>
);

const SkeletonLoader = () => {
    const SkeletonColumn = ({ rows = 8, width = "320px", isSub = false }) => ( 
        <div style={{ flex: `0 0 ${width}`, display: 'flex', flexDirection: 'column', borderRight: isSub ? '1px solid #f1f5f9' : 'none', background: '#fff', borderRadius: isSub ? 0 : '16px', border: isSub ? 'none' : '1px solid #e2e8f0', marginRight: isSub ? 0 : '1.5rem', height: '100%' }}> 
            <div className="skeleton-portlet-header"> <div className="skeleton-placeholder skeleton-title"></div> <div className="skeleton-placeholder skeleton-icon-placeholder"></div> </div> 
            <div className="skeleton-portlet-body"> <div className="skeleton-placeholder skeleton-search"></div> {Array.from({ length: rows }).map((_, rowIndex) => ( <div className="skeleton-placeholder skeleton-list-item" key={rowIndex}> <div className="skeleton-item-icon"></div> <div className="skeleton-item-text"></div> <div className="skeleton-item-actions"> <div className="skeleton-action-icon"></div> <div className="skeleton-action-icon"></div> </div> </div> ))} </div> 
        </div> 
    );
    const skeletonStyles = ` @keyframes skeleton-pulse { 0% { background-color: #f7f8fa; } 50% { background-color: #e9ecf2; } 100% { background-color: #f7f8fa; } } .skeleton-placeholder { animation: skeleton-pulse 1.8s infinite ease-in-out; background-color: #f7f8fa; border-radius: 4px; } .skeleton-portlet-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; } .skeleton-title { height: 18px; width: 55%; } .skeleton-icon-placeholder { height: 24px; width: 24px; border-radius: 50%; } .skeleton-portlet-body { padding: 0 1.25rem; } .skeleton-search { height: 36px; width: 100%; margin-bottom: 20px; border-radius: 8px; } .skeleton-list-item { height: 45px; width: 100%; margin-bottom: 12px; display: flex; align-items: center; padding: 0 12px; gap: 12px; } .skeleton-item-icon { height: 16px; width: 12px; flex-shrink: 0; } .skeleton-item-text { height: 14px; width: 70%; } .skeleton-item-actions { margin-left: auto; display: flex; gap: 8px; flex-shrink: 0; } .skeleton-action-icon { height: 14px; width: 14px; } .skeleton-tab-container { flex-grow: 1; display: flex; flex-direction: column; background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; } .skeleton-tab-header { display: flex; padding: 0 1.5rem; margin-bottom: 0; border-bottom: 1px solid #f1f5f9; height: 60px; align-items: center; } .skeleton-tab { height: 20px; width: 120px; margin-right: 30px; } .skeleton-tab-content { display: flex; flex-grow: 1; overflow-x: hidden; height: calc(100% - 60px); } `;
    return ( <><style>{skeletonStyles}</style><div className="cm-container" style={{ display: 'flex', gap: '0', height: 'calc(100vh - 150px)', overflow: 'hidden' }}><SkeletonColumn rows={9} width="320px" /><SkeletonColumn rows={4} width="320px" /><div className="skeleton-tab-container" style={{ marginLeft: '1.5rem' }}><div className="skeleton-tab-header"><div className="skeleton-placeholder skeleton-tab"></div><div className="skeleton-placeholder skeleton-tab"></div></div><div className="skeleton-tab-content"><SkeletonColumn rows={6} width="350px" isSub={true} /><SkeletonColumn rows={5} width="350px" isSub={true} /></div></div></div></> );
};

const toastr = window.toastr;

class CurriculumManagerV5 extends React.Component {
    scrollContainerRef = React.createRef();
    _schoolSubscription = null;
    _attemptsSubscription = null; 
    styleTag = null;

    // --- Refs for Modals ---
    addGradeModalRef = React.createRef(); editGradeModalRef = React.createRef(); deleteGradeModalRef = React.createRef();
    addSubjectModalRef = React.createRef(); editSubjectModalRef = React.createRef(); deleteSubjectModalRef = React.createRef();
    addTopicModalRef = React.createRef(); editTopicModalRef = React.createRef(); deleteTopicModalRef = React.createRef();
    addSubtopicModalRef = React.createRef(); editSubtopicModalRef = React.createRef(); deleteSubtopicModalRef = React.createRef();
    addQuestionModalRef = React.createRef(); editQuestionModalRef = React.createRef(); deleteQuestionModalRef = React.createRef();
    addOptionModalRef = React.createRef(); editOptionModalRef = React.createRef(); deleteOptionModalRef = React.createRef();

    state = {
        isLoading: true, school: null, _masterGradesList: [], grades: [],
        filteredSubjects: [], filteredTopics: [], filteredSubtopics: [], filteredQuestions: [], filteredOptions: [],
        selectedGrade: null, selectedSubject: null, selectedTopic: null, selectedSubtopic: null, selectedQuestion: null,
        gradeToEdit: {}, gradeToDelete: {}, subjectToEdit: {}, subjectToDelete: {}, topicToEdit: {}, topicToDelete: {},
        subtopicToEdit: {}, subtopicToDelete: {}, questionToEdit: {}, questionToDelete: {}, optionToEdit: {}, optionToDelete: {},
        gradeSearchTerm: '', subjectSearchTerm: '', topicSearchTerm: '', subtopicSearchTerm: '', questionSearchTerm: '', optionSearchTerm: '',
        activeTab: 'planning', allLessonAttempts: [], subjectLessonAttempts: [], usersWithAttempts: [],
        selectedUserId: null, selectedAttemptId: null,
        questionImagesMap: {}, // Cache for fetched question images
        
        // Planning & Term State
        terms: [],
        selectedTermId: null,
        schemesOfWork: [],
        filteredSchemes: [],
        recordsOfWork: [],
        filteredRecords: [],
        lessonPlans: [],
        filteredLessonPlans: [],
        iepTemplates: [],
        filteredIepTemplates: [],
        planningSubTab: 'scheme', // 'scheme', 'lesson', 'record', or 'iep'
        isPlanningLoading: false,
        schemeToEdit: null,
        recordToEdit: null,
        lessonPlanToEdit: null,
        iepToEdit: null,
        showPlanningModal: false,
        
        // Print System
        showPrintView: false,
        printData: null,
    };

    componentDidMount() {
        const customStyles = `
            :root { --cm-primary-color: #5867dd; --cm-primary-bg-light: #f0f3ff; --cm-border-color: #e2e8f0; --cm-text-main: #1e293b; --cm-text-secondary: #64748b; --cm-bg-main: #f7f8fa; --cm-danger-color: #ef4444; }
            
            .cm-container {
                background-color: var(--cm-bg-main);
                padding: 1.5rem;
                width: 100vw;
                margin-left: calc(50% - 50vw);
                box-sizing: border-box;
                min-height: calc(100vh - 100px);
            }

            .cm-header-main { margin-bottom: 1rem; }
            .cm-header-main h3 { font-weight: 600; font-size: 1.5rem; color: var(--cm-text-main); }
            
            /* Main Horizontal Scroller */
            .scrolling-wrapper { display: flex; flex-wrap: nowrap; overflow-x: auto; -webkit-overflow-scrolling: touch; gap: 1.5rem; padding-bottom: 1rem; width:100%; scroll-behavior: smooth; }
            .scrolling-wrapper::-webkit-scrollbar { height: 6px; }
            .scrolling-wrapper::-webkit-scrollbar-track { background: transparent; }
            .scrolling-wrapper::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
            
            /* Column Cards */
            .cm-column { 
                flex: 0 0 auto; 
                width: 320px; 
                background: #fff; 
                border: 1px solid var(--cm-border-color); 
                border-radius: 16px; 
                display: flex; 
                flex-direction: column; 
                box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
                overflow: hidden;
                max-height: calc(100vh - 200px);
            }
            .cm-column.cm-column-large { 
                width: auto; 
                min-width: 350px; 
                max-width: none;
                flex-grow: 0;
            }
            
            /* Sub-column refinement for flush look within the Content Tab */
            .cm-sub-column {
                width: 350px;
                flex-shrink: 0;
                display: flex;
                flex-direction: column;
                border-right: 1px solid #f1f5f9;
                height: 100%;
            }
            .cm-sub-column:last-child { border-right: none; }
            
            .cm-column-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid #f1f5f9; background-color: #fafbfd; }
            .cm-column-header h5 { margin: 0; font-size: 0.95rem; font-weight: 600; color: #1e293b; letter-spacing: 0.3px; }
            .cm-add-btn { background: #f1f5f9; border: none; cursor: pointer; color: #64748b; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
            .cm-add-btn:hover { background: var(--cm-primary-color); color: #fff; transform: scale(1.1); }
            .cm-add-btn i { font-size: 0.9rem; }
            
            .cm-column-body { padding: 1.25rem; flex-grow: 1; display: flex; flex-direction: column; overflow-y: auto; }
            .cm-search-wrapper { position: relative; margin-bottom: 1.25rem; flex-shrink: 0; }
            .cm-search-input { padding-left: 2.5rem; border-radius: 10px; border: 1px solid #e2e8f0; background: #f8fafc; font-size: 0.85rem; height: 40px; }
            .cm-search-input:focus { background: #fff; }
            .search-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 1rem; }
            
            .cm-tab-header { display: flex; gap: 2.5rem; padding: 0 2rem; border-bottom: 2px solid #f1f5f9; background-color: #fcfdfe; flex-shrink: 0; box-shadow: inset 0 -1px 0 #e2e8f0; }
            .cm-tab-btn { background: none; border: none; padding: 1.25rem 0; cursor: pointer; color: #94a3b8; font-weight: 700; position: relative; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px; transition: all 0.2s; }
            .cm-tab-btn:hover { color: var(--cm-primary-color); }
            .cm-tab-btn.active { color: var(--cm-primary-color); }
            .cm-tab-btn.active::after { content: ''; position: absolute; bottom: -2px; left: 0; right: 0; height: 3px; background-color: var(--cm-primary-color); border-radius: 4px 4px 0 0; box-shadow: 0 -1px 4px rgba(88, 103, 221, 0.2); }
            
            .tab-content { flex-grow: 1; display: flex; flex-direction: column; overflow: hidden; }
            .tab-pane { display: none; flex-grow: 1; height: 100%; }
            .tab-pane.active { display: flex; flex-direction: column; }
            .tab-inner-scroller { display: flex; flex-wrap: nowrap; flex-grow: 1; overflow-x: auto; background: #fff; height: 100%; }
            .tab-inner-scroller::-webkit-scrollbar { height: 4px; }
            
            .draggable-generic-list-item.selected { border-left: 4px solid var(--cm-primary-color) !important; background-color: var(--cm-primary-bg-light) !important; font-weight: 500; }
            
            /* Student Attempts Tab Styles */
            .attempts-grid { display: grid; grid-template-columns: 1fr 1fr 450px; gap: 0; flex-grow: 1; height: 100%; border-top: 1px solid #f1f5f9; }
            .attempts-column { border-right: 1px solid #f1f5f9; display: flex; flex-direction: column; background: #fff; overflow: hidden; min-width: 0; }
            .attempts-column:last-child { border-right: none; background: #f8fafc; flex-grow: 1; }
            .attempts-column .list-group { border: none; padding: 1rem; overflow-y: auto; flex-grow: 1; }
            .attempts-column .list-group-item { border: 1px solid transparent; border-radius: 10px; margin-bottom: 8px; transition: all 0.2s ease; cursor: pointer; padding: 1rem; position: relative; }
            .attempts-column .list-group-item:hover { background-color: #f1f5f9; }
            .attempts-column .list-group-item.active { background-color: var(--cm-primary-bg-light); border-color: var(--cm-primary-color); color: #1e293b; box-shadow: 0 2px 4px rgba(88, 103, 221, 0.1); }
            .attempts-column h6 { font-weight: 700; font-size: 0.85rem; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; padding: 1.25rem 1.5rem 0.5rem; margin: 0; flex-shrink: 0; border-bottom: 1px solid #f1f5f9; background: #fff; }
            
            .user-list-item.active { font-weight: 600; }
            .student-sub-item { font-size: 0.75rem; color: #64748b; margin-top: 4px; display: flex; align-items: center; gap: 4px; }
            .student-reg-badge { font-size: 10px; background: #f1f5f9; color: #64748b; padding: 0px 6px; border-radius: 4px; font-weight: 600; border: 1px solid #e2e8f0; }
            
            .attempt-list-item-content { display: flex; justify-content: space-between; align-items: center; width: 100%; }
            .attempt-score-badge { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; font-weight: 700; box-shadow: 0 2px 8px rgba(0,0,0,0.05); flex-shrink: 0; }
            .attempt-score-badge.low-score { background-color: #fff1f2; color: #e11d48; border: 1px solid #fecaca; }
            .attempt-score-badge.high-score { background-color: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
            
            .attempt-details-container { width: 100%; padding: 1.5rem; overflow-y: auto; flex-grow: 1; }
            .attempt-details-card { width: 100%; margin-bottom: 1.5rem; border: 1px solid #e2e8f0; border-radius: 16px; background: #fff; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.03); }
            .attempt-events-timeline { padding: 0 1.5rem 1.5rem; border-top: 1px solid #f1f5f9; background: #fcfdfe; }
            .attempt-event-item { transition: transform 0.2s; display: flex; gap: 1rem; padding: 1rem 0; }
            .attempt-event-item:hover { transform: translateX(5px); }

            /* Answer Displays */
            .answer-details { padding: 8px 1.5rem; background: #fff; }
            .option-display { padding: 10px 12px; border-radius: 8px; margin-bottom: 6px; border: 1px solid #f1f5f9; display: flex; align-items: center; gap: 10px; font-size: 0.85rem; color: #64748b; }
            .option-display i { font-size: 1rem; }
            .option-display.selected-correct { background-color: #f0fdf4; border-color: #bbf7d0; color: #16a34a; font-weight: 600; }
            .option-display.selected-incorrect { background-color: #fff1f2; border-color: #fecaca; color: #e11d48; font-weight: 600; }
            .option-display.correct { border-style: dashed; border-color: #16a34a; color: #16a34a; }
            
            .text-answer { padding: 1rem; border-radius: 12px; background: #f8fafc; border: 1px solid #e2e8f0; }
            .image-answer img { max-width: 100%; border-radius: 12px; border: 1px solid #e2e8f0; cursor: zoom-in; margin-top: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
            
            .attempt-event-icon { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; flex-shrink: 0; }
            .attempt-event-icon.correct { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
            .attempt-event-icon.incorrect { background: #fff1f2; color: #e11d48; border: 1px solid #fecaca; }
            .attempt-event-details { flex-grow: 1; }
            .attempt-event-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px; }
            .attempt-event-title { font-weight: 600; font-size: 0.85rem; color: #334155; }
            .attempt-event-meta { font-size: 0.7rem; color: #94a3b8; display: flex; flex-direction: column; align-items: flex-end; }
            .attempt-event-points { color: var(--cm-primary-color); font-weight: 700; margin-bottom: 2px; }
            .attempt-event-icon { flex-shrink: 0; width: 24px; text-align: center; }
            .attempt-event-icon.correct { color: #16a34a; }
            .attempt-event-icon.incorrect { color: #ef4444; }
            .attempt-event-header { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
            .attempt-event-title { font-weight: 600; font-size: 0.9rem; }
            .attempt-event-meta { font-size: 0.8rem; color: #64748b; display: flex; gap: 10px; }
            
            .option-display { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; margin-bottom: 4px; font-size: 0.9rem; }
            .option-display i { margin-right: 8px; }
            .option-display.correct { background-color: #f0fdf4; border-color: #bbf7d0; color: #166534; }
            .option-display.selected-incorrect { background-color: #fef2f2; border-color: #fecaca; color: #991b1b; }
            .option-display.selected-correct { background-color: #dcfce7; border-color: #86efac; color: #15803d; font-weight: 600; }
            
            /* Teacher Planning Styles */
            .planning-header { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; background: #fff; border-bottom: 1px solid #f1f5f9; }
            .planning-sub-tabs { display: flex; gap: 1rem; }
            .planning-sub-tab { padding: 0.5rem 1rem; border-radius: 8px; border: 1px solid #e2e8f0; background: #f8fafc; cursor: pointer; font-size: 0.85rem; font-weight: 600; color: #64748b; transition: all 0.2s; }
            .planning-sub-tab.active { background: var(--cm-primary-color); color: #fff; border-color: var(--cm-primary-color); }
            
            .planning-content { padding: 1.5rem; overflow-y: auto; flex-grow: 1; }
            .planning-table-container { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow-x: auto; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1); }
            .planning-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
            .planning-table th { background: #fafbfd; padding: 1rem; text-align: left; font-weight: 700; color: #475569; border-bottom: 2px solid #f1f5f9; white-space: nowrap; }
            .planning-table td { padding: 1rem; border-bottom: 1px solid #f1f5f9; color: #334155; vertical-align: top; }
            .planning-table tr:hover { background: #fcfdfe; }
            
            .planning-actions { display: flex; gap: 0.5rem; }
            .planning-btn { width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; border: 1px solid #e2e8f0; background: #fff; cursor: pointer; transition: all 0.2s; }
            .planning-btn:hover { background: #f1f5f9; color: var(--cm-primary-color); }
            .planning-btn.btn-danger:hover { color: #ef4444; }
            
            .rich-content-cell { max-width: 300px; max-height: 150px; overflow-y: auto; line-height: 1.5; color: #64748b; }
            .rich-content-cell p { margin-bottom: 0.5rem; }
            
            /* Print Styles */
            @media print {
                /* Hide UI Clutter */
                #kt_header, #kt_header_mobile, #kt_header_secondary, .kt-subheader, .kt-footer, .kt-aside, .d-print-none, .cm-tab-header, .cm-header-main, .cm-column:not(.cm-column-large), .planning-header button, .planning-actions { 
                    display: none !important; 
                }
                
                /* Reset Layout for Print */
                body, html { 
                    background: white !important; 
                    margin: 0 !important; 
                    padding: 0 !important; 
                    height: auto !important;
                }
                
                .cm-container {
                    padding: 0 !important;
                    margin: 0 !important;
                    width: 100% !important;
                    background: white !important;
                }

                #kt_wrapper, .kt-content, .kt-container, #print-area { 
                    background: white !important; 
                    padding: 0 !important; 
                    margin: 0 !important; 
                    width: 100% !important; 
                    max-width: 100% !important; 
                    display: block !important;
                    border: none !important;
                }

                .planning-print-root {
                    padding: 0 !important;
                    margin: 0 !important;
                    width: 100% !important;
                    border: none !important;
                }

                .report-card-container { 
                    page-break-after: auto; 
                    width: 100% !important; 
                    max-width: none !important;
                    height: auto !important; 
                    border: none !important; 
                    margin: 0 !important; 
                    box-shadow: none !important; 
                }
                
                .planning-table-container { border: none; box-shadow: none; }
                .planning-table th { background: #f1f5f9 !important; border: 1px solid #e2e8f0 !important; -webkit-print-color-adjust: exact; }
                .planning-table td { border: 1px solid #e2e8f0 !important; }
                .rich-content-cell { max-width: none; max-height: none; overflow: visible; }
            }
        `;
        const styleTag = document.createElement("style");
        styleTag.innerHTML = customStyles;
        document.head.appendChild(styleTag);
        this.styleTag = styleTag;

        window.addEventListener('beforeunload', this.saveStateToLocalStorage);
        this._schoolSubscription = Data.schools.subscribe(this.processDataUpdate);
        
        // Keep individual subscriptions for real-time CRUD operations
        this._schemesSubscription = Data.scheme_of_works.subscribe(({ scheme_of_works }) => {
            this.setState({ schemesOfWork: scheme_of_works }, this.refreshPlanningFilters);
        });
        
        this._recordsSubscription = Data.record_of_works.subscribe(({ record_of_works }) => {
            this.setState({ recordsOfWork: record_of_works }, this.refreshPlanningFilters);
        });
        
        this._lessonPlansSubscription = Data.lesson_plans.subscribe(({ lesson_plans }) => {
            this.setState({ lessonPlans: lesson_plans }, this.refreshPlanningFilters);
        });
        
        this._iepTemplatesSubscription = Data.iep_templates.subscribe(({ iep_templates }) => {
            this.setState({ iepTemplates: iep_templates }, this.refreshPlanningFilters);
        });

        this._termsSubscription = Data.terms.subscribe(({ terms }) => {
            const sortedTerms = (terms || []).sort((a, b) => (a.order || 0) - (b.order || 0));
            this.setState({ terms: sortedTerms }, () => {
                if (!this.state.selectedTermId && sortedTerms.length > 0) {
                    // Default to Term 1 if possible
                    const term1 = sortedTerms.find(t => t.name.toLowerCase().includes('term 1')) || sortedTerms[0];
                    this.setState({ selectedTermId: term1.id }, this.refreshPlanningFilters);
                }
            });
        });
        
        if (Data.lessonAttempts && typeof Data.lessonAttempts.subscribe === 'function') {
            this._attemptsSubscription = Data.lessonAttempts.subscribe(({ lessonAttempts }) => {
                this.setState({ allLessonAttempts: lessonAttempts }, () => {
                    if (this.state.selectedSubject) {
                        this.processLessonAttemptsForSubject(this.state.selectedSubject);
                    }
                });
            });
        }
        const initialData = { schools: Data.schools.list() };
        this.processDataUpdate(initialData);
    }

    componentWillUnmount() {
        if (this._schoolSubscription) this._schoolSubscription();
        if (this._attemptsSubscription) this._attemptsSubscription();
        if (this._schemesSubscription) this._schemesSubscription();
        if (this._recordsSubscription) this._recordsSubscription();
        if (this._lessonPlansSubscription) this._lessonPlansSubscription();
        if (this._iepTemplatesSubscription) this._iepTemplatesSubscription();
        if (this._termsSubscription) this._termsSubscription();
        if (this.styleTag) this.styleTag.remove();
        window.removeEventListener('beforeunload', this.saveStateToLocalStorage);
    }
    


    // --- Data Processing & State Management ---
    processDataUpdate = ({ schools }) => {
        const activeId = localStorage.getItem("school");
        const activeSchool = schools.find(school => school.id === activeId);
        
        if (schools.length === 0) return; 

        if (!activeSchool) { this.setState({ isLoading: false, school: null, _masterGradesList: [] }); return; }
        const masterGradesList = activeSchool.grades || [];
        
        // Only extract planning data from nested hierarchy if flat arrays are empty
        // This preserves real-time updates from individual subscriptions
        const planningData = (this.state.schemesOfWork.length === 0 && 
                             this.state.recordsOfWork.length === 0 && 
                             this.state.lessonPlans.length === 0 && 
                             this.state.iepTemplates.length === 0) 
            ? this.extractPlanningDataFromHierarchy(activeSchool) 
            : {};
        
        // Refined loading logic: Stay "loading" if we have placeholder grades (no names yet)
        const isDataReady = masterGradesList.length === 0 || masterGradesList.some(g => g.name);
        
        const stateSource = this.state.isLoading ? JSON.parse(localStorage.getItem("learningState") || '{}') : this.state;
        const validatedState = this.getValidatedState(stateSource, masterGradesList);
        
        this.setState({ 
            ...validatedState, 
            school: activeSchool, 
            _masterGradesList: masterGradesList,
            ...planningData, // Add extracted planning data only if needed
            isLoading: this.state.isLoading ? !isDataReady : false
        }, () => {
            this.refreshCurrentSelectionsAndFilters();
            this.refreshPlanningFilters(); // Explicitly refresh planning data once names are resolved
            if (this.state.selectedSubject) this.processLessonAttemptsForSubject(this.state.selectedSubject);
            
            // Restore scroll position once data is ready and rendered
            if (isDataReady && stateSource.scrollLeft !== undefined) {
                setTimeout(() => {
                    if (this.scrollContainerRef.current) {
                        this.scrollContainerRef.current.scrollLeft = stateSource.scrollLeft;
                    }
                }, 100);
            }
        });
    };

    extractPlanningDataFromHierarchy = (school) => {
        const schemesOfWork = [];
        const recordsOfWork = [];
        const lessonPlans = [];
        const iepTemplates = [];

        if (!school || !school.grades) {
            return { schemesOfWork, recordsOfWork, lessonPlans, iepTemplates };
        }

        school.grades.forEach(grade => {
            if (!grade.subjects) return;
            
            grade.subjects.forEach(subject => {
                if (!subject.topics) return;
                
                subject.topics.forEach(topic => {
                    // Extract IEP templates from topics
                    if (topic.iep_templates) {
                        topic.iep_templates.forEach(iep => {
                            iepTemplates.push({
                                ...iep,
                                subject: { id: subject.id },
                                term: iep.term,
                                strand: topic.id,
                                substrands: null
                            });
                        });
                    }
                    
                    if (!topic.subtopics) return;
                    
                    topic.subtopics.forEach(subtopic => {
                        // Extract schemes of work from subtopics
                        if (subtopic.scheme_of_works) {
                            subtopic.scheme_of_works.forEach(scheme => {
                                schemesOfWork.push({
                                    ...scheme,
                                    subject: { id: subject.id },
                                    term: scheme.term,
                                    strand: topic.id,
                                    substrands: subtopic.id
                                });
                            });
                        }
                        
                        // Extract lesson plans from subtopics
                        if (subtopic.lesson_plans) {
                            subtopic.lesson_plans.forEach(lesson => {
                                lessonPlans.push({
                                    ...lesson,
                                    subject: { id: subject.id },
                                    term: lesson.term,
                                    strand: topic.id,
                                    substrands: subtopic.id
                                });
                            });
                        }
                        
                        // Extract records of work from subtopics
                        if (subtopic.record_of_works) {
                            subtopic.record_of_works.forEach(record => {
                                recordsOfWork.push({
                                    ...record,
                                    subject: { id: subject.id },
                                    term: record.term,
                                    strand: topic.id,
                                    substrands: subtopic.id
                                });
                            });
                        }
                    });
                });
            });
        });

        return { schemesOfWork, recordsOfWork, lessonPlans, iepTemplates };
    };

    getValidatedState = (sourceState, masterGradesList) => {
        const validated = { 
            selectedGrade: sourceState.selectedGrade || null, 
            selectedSubject: sourceState.selectedSubject || null, 
            selectedTopic: sourceState.selectedTopic || null, 
            selectedSubtopic: sourceState.selectedSubtopic || null, 
            selectedQuestion: sourceState.selectedQuestion || null, 
            gradeSearchTerm: sourceState.gradeSearchTerm || '', 
            subjectSearchTerm: sourceState.subjectSearchTerm || '', 
            topicSearchTerm: sourceState.topicSearchTerm || '', 
            subtopicSearchTerm: sourceState.subtopicSearchTerm || '', 
            questionSearchTerm: sourceState.questionSearchTerm || '', 
            optionSearchTerm: sourceState.optionSearchTerm || '', 
            questionSearchTerm: sourceState.questionSearchTerm || '', 
            optionSearchTerm: sourceState.optionSearchTerm || '', 
            activeTab: sourceState.activeTab || 'planning',
            planningSubTab: sourceState.planningSubTab || 'scheme',
            selectedTermId: sourceState.selectedTermId || null,
            scrollLeft: sourceState.scrollLeft || 0
        };

        // If we haven't loaded any grades with names yet, keep the full selection sourceState provided.
        // Once names start appearing, we can begin validating.
        const hasLoadedNames = masterGradesList.some(g => g.name);
        if (!hasLoadedNames) return validated;

        try { 
            const grade = masterGradesList.find(g => g.id === validated.selectedGrade); 
            if (validated.selectedGrade && !grade) { validated.selectedGrade = null; }
            
            if (grade) {
                const subjects = grade.subjects || [];
                const subject = subjects.find(s => s.id === validated.selectedSubject);
                // Only clear subject if we actually have subject names to compare against
                if (validated.selectedSubject && subjects.some(s => s.name) && !subject) {
                    validated.selectedSubject = null;
                }

                if (subject) {
                    const topics = subject.topics || [];
                    const topic = topics.find(t => t.id === validated.selectedTopic);
                    if (validated.selectedTopic && topics.some(t => t.name) && !topic) {
                        validated.selectedTopic = null;
                    }

                    if (topic) {
                        const subtopics = topic.subtopics || [];
                        const subtopic = subtopics.find(st => st.id === validated.selectedSubtopic);
                        if (validated.selectedSubtopic && subtopics.some(st => st.name) && !subtopic) {
                            validated.selectedSubtopic = null;
                        }

                        if (subtopic) {
                            const questions = subtopic.questions || [];
                            const question = questions.find(q => q.id === validated.selectedQuestion);
                            if (validated.selectedQuestion && questions.some(q => q.name) && !question) {
                                validated.selectedQuestion = null;
                            }
                        }
                    }
                }
            }
        } catch (error) { console.error("Failed to validate state:", error); }
        return validated;
    }

    saveStateToLocalStorage = () => { 
        if (this.state.isLoading || !this.state.school) return; 
        const { selectedGrade, selectedSubject, selectedTopic, selectedSubtopic, selectedQuestion, gradeSearchTerm, subjectSearchTerm, topicSearchTerm, subtopicSearchTerm, questionSearchTerm, optionSearchTerm, activeTab, planningSubTab, selectedTermId } = this.state; 
        const scrollLeft = this.scrollContainerRef.current ? this.scrollContainerRef.current.scrollLeft : 0;
        localStorage.setItem("learningState", JSON.stringify({ 
            selectedGrade, selectedSubject, selectedTopic, selectedSubtopic, selectedQuestion, 
            gradeSearchTerm, subjectSearchTerm, topicSearchTerm, subtopicSearchTerm, 
            questionSearchTerm, optionSearchTerm, activeTab, planningSubTab, selectedTermId, scrollLeft 
        })); 
    };

    componentDidUpdate(prevProps, prevState) { 
        const persistedStateKeys = ['selectedGrade', 'selectedSubject', 'selectedTopic', 'selectedSubtopic', 'selectedQuestion', 'gradeSearchTerm', 'subjectSearchTerm', 'topicSearchTerm', 'subtopicSearchTerm', 'questionSearchTerm', 'optionSearchTerm', 'activeTab', 'planningSubTab', 'selectedTermId']; 
        const hasPersistedStateChanged = persistedStateKeys.some(key => JSON.stringify(prevState[key]) !== JSON.stringify(this.state[key])); 
        if (hasPersistedStateChanged) { 
            this.saveStateToLocalStorage(); 
        } 
        
        const { selectedSubject, selectedTermId, selectedTopic, selectedSubtopic } = this.state;
        if (prevState.selectedSubject !== selectedSubject && selectedSubject) { 
            this.processLessonAttemptsForSubject(selectedSubject); 
            this.refreshPlanningFilters();
        } 
        if (prevState.selectedTermId !== selectedTermId || prevState.selectedTopic !== selectedTopic || prevState.selectedSubtopic !== selectedSubtopic || prevState._masterGradesList !== this.state._masterGradesList) {
            this.refreshPlanningFilters();
        }
    }

    refreshPlanningFilters = () => {
        const { 
            schemesOfWork, recordsOfWork, lessonPlans, iepTemplates, 
            selectedSubject, selectedTermId, selectedTopic, selectedSubtopic, terms 
        } = this.state;

        // Use current selectedTermId or fallback to the first term found
        let activeTermId = selectedTermId;
        if (!activeTermId && terms.length > 0) {
            const term1 = terms.find(t => t.name.toLowerCase().includes('term 1')) || terms[0];
            activeTermId = term1.id;
        }

        // Helper to extract ID from either an object or a string
        const getAttrId = (val) => (val && typeof val === 'object' ? val.id : val);

        const filterFn = (item) => {
            // 1. Match Subject
            const itemSubjectId = getAttrId(item.subject);
            const matchesSubject = !selectedSubject || String(itemSubjectId) === String(selectedSubject);

            // 2. Match Term
            const itemTermId = getAttrId(item.term);
            const matchesTerm = !activeTermId || String(itemTermId) === String(activeTermId);

            // 3. Match Hierarchy (Topic/Subtopic)
            // Note: In your Data.js flattening:
            // Schemes/Records/Lessons are grouped by subtopic (substrands)
            // IEPs are grouped by topic (strand)
            const itemStrandId = getAttrId(item.strand);
            const itemSubstrandId = getAttrId(item.substrands);

            const matchesTopic = !selectedTopic || String(itemStrandId) === String(selectedTopic);
            const matchesSubtopic = !selectedSubtopic || String(itemSubstrandId) === String(selectedSubtopic);

            return matchesSubject && matchesTerm && matchesTopic && matchesSubtopic && !item.isDeleted;
        };

        // Separate filter for IEPs because they don't necessarily require a subtopic selected
        const iepFilterFn = (item) => {
            const itemSubjectId = getAttrId(item.subject);
            const itemStrandId = getAttrId(item.strand);
            
            const matchesSubject = !selectedSubject || String(itemSubjectId) === String(selectedSubject);
            const matchesTopic = !selectedTopic || String(itemStrandId) === String(selectedTopic);
            
            return matchesSubject && matchesTopic && !item.isDeleted;
        };

        const resolveNames = (item) => ({
            ...item,
            strand: this.getTopicName(item.strand),
            substrands: this.getSubtopicName(item.substrands)
        });

        this.setState({
            filteredSchemes: schemesOfWork.filter(filterFn).map(resolveNames),
            filteredRecords: recordsOfWork.filter(filterFn).map(resolveNames),
            filteredLessonPlans: lessonPlans.filter(filterFn).map(resolveNames),
            filteredIepTemplates: iepTemplates.filter(iepFilterFn).map(resolveNames)
        });
    }

    getTopicName = (id) => {
        const rawId = id && typeof id === 'object' ? id.id : id;
        const { selectedGrade, selectedSubject, _masterGradesList } = this.state;
        const grade = _masterGradesList.find(g => String(g.id) === String(selectedGrade));
        const subject = grade?.subjects?.find(s => String(s.id) === String(selectedSubject));
        const topic = subject?.topics?.find(t => String(t.id) === String(rawId));
        return topic ? topic.name : "Unknown Strand";
    }

    getSubtopicName = (id) => {
        const rawId = id && typeof id === 'object' ? id.id : id;
        const { selectedGrade, selectedSubject, selectedTopic, _masterGradesList } = this.state;
        const grade = _masterGradesList.find(g => String(g.id) === String(selectedGrade));
        const subject = grade?.subjects?.find(s => String(s.id) === String(selectedSubject));
        const topic = subject?.topics?.find(t => String(t.id) === String(selectedTopic));
        const subtopic = topic?.subtopics?.find(st => String(st.id) === String(rawId));
        return subtopic ? subtopic.name : "Unknown Sub-strand";
    }

    handlePlanningSubTabChange = (tab) => {
        this.setState({ planningSubTab: tab }, () => {
            // Auto-scroll to show the content
            setTimeout(() => this.scrollToEnd(), 50);
        });
    }

    togglePrintView = () => this.setState(prev => ({ showPrintView: !prev.showPrintView, printData: null }));
    handlePrint = () => window.print();

    handlePrintPlanning = () => {
        const { school, selectedSubject, selectedTermId, selectedTopic, selectedSubtopic, schemesOfWork, recordsOfWork, lessonPlans, iepTemplates, terms, _masterGradesList, selectedGrade } = this.state;
        
        const term = terms.find(t => t.id === selectedTermId);
        const grade = _masterGradesList.find(g => g.id === selectedGrade);
        const subject = grade?.subjects?.find(s => s.id === selectedSubject);
        
        // Get user from localStorage, then try to find the full teacher profile in Data.teachers.list()
        let user = JSON.parse(localStorage.getItem("user") || '{}');
        const teachersList = Data.teachers.list() || [];
        const fullTeacherProfile = teachersList.find(t => String(t.id) === String(user.id));
        if (fullTeacherProfile) {
            user = { ...user, ...fullTeacherProfile };
        }
        
        const filterByTermAndSubject = (items) => items.filter(item => {
            const matchesSubject = String(item.subject?.id || item.subject) === String(selectedSubject);
            const itemTermId = item.term?.id || item.term;
            const matchesTerm = String(itemTermId) === String(selectedTermId);
            return matchesSubject && (matchesTerm || !itemTermId) && !item.isDeleted;
        });

        const allSchemes = filterByTermAndSubject(schemesOfWork).sort((a, b) => (a.week - b.week) || (a.lessonnumber - b.lessonnumber)).map(item => ({
            ...item, strand: this.getTopicName(item.strand), substrands: this.getSubtopicName(item.substrands)
        }));
        const allLessonPlans = filterByTermAndSubject(lessonPlans).map(item => ({
            ...item, strand: this.getTopicName(item.strand), substrands: this.getSubtopicName(item.substrands)
        }));
        const allRecords = filterByTermAndSubject(recordsOfWork || []).sort((a, b) => (a.week - b.week)).map(item => ({
            ...item, strand: this.getTopicName(item.strand), substrands: this.getSubtopicName(item.substrands)
        }));
        const allIep = filterByTermAndSubject(iepTemplates).map(item => ({
            ...item, strand: this.getTopicName(item.strand), substrands: this.getSubtopicName(item.substrands)
        }));

        this.setState({
            showPrintView: true,
            printData: { school, teacher: user, subject, grade, term, allSchemes, allLessonPlans, allRecords, allIep }
        });
    }

    handleSaveScheme = async (e) => {
        e.preventDefault();
        const { schemeToEdit, selectedSubject, school } = this.state;
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        // Handle numerical fields
        data.week = parseInt(data.week) || 0;
        data.lessonnumber = parseInt(data.lessonnumber) || 0;
        
        // Handle Quill fields (if any passed, but we'll use state-managed Quill usually)
        // For simplicity in this iteration, I'll assume standard inputs or a shared state for Quill
        
        try {
            const { selectedTermId, selectedTopic, selectedSubtopic } = this.state;
            if (schemeToEdit?.id) {
                await Data.scheme_of_works.update({ 
                    ...data, 
                    id: schemeToEdit.id,
                    term: selectedTermId,
                    strand: selectedTopic,
                    substrands: selectedSubtopic
                });
                toastr.success("Scheme updated!");
            } else {
                await Data.scheme_of_works.create({ 
                    ...data, 
                    subject: selectedSubject, 
                    school: school.id,
                    term: selectedTermId,
                    strand: selectedTopic,
                    substrands: selectedSubtopic,
                    teacher: JSON.parse(localStorage.getItem("user"))?.id
                });
                toastr.success("Scheme created!");
            }
            this.setState({ showPlanningModal: false, schemeToEdit: null });
        } catch (err) {
            toastr.error("Failed to save scheme");
        }
    }

    handleSaveRecord = async (e) => {
        e.preventDefault();
        const { recordToEdit, selectedSubject, school } = this.state;
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        data.week = parseInt(data.week) || 0;

        try {
            const { selectedTermId, selectedTopic, selectedSubtopic } = this.state;
            if (recordToEdit?.id) {
                await Data.record_of_works.update({ 
                    ...data, 
                    id: recordToEdit.id,
                    term: selectedTermId,
                    strand: selectedTopic,      // Topic ID
                    substrands: selectedSubtopic // Subtopic ID
                });
                toastr.success("Record updated!");
            } else {
                await Data.record_of_works.create({ 
                    ...data, 
                    subject: selectedSubject, 
                    school: school.id,
                    term: selectedTermId,
                    strand: selectedTopic,      // Topic ID
                    substrands: selectedSubtopic, // Subtopic ID
                    teacher: JSON.parse(localStorage.getItem("user"))?.id
                });
                toastr.success("Record created!");
            }
            this.setState({ showPlanningModal: false, recordToEdit: null });
        } catch (err) {
            toastr.error("Failed to save record");
        }
    }
    
    fetchQuestionImages = async (questions) => {
        if (!questions || questions.length === 0) return;
        const missingImageIds = questions.filter(q => !this.state.questionImagesMap[q.id]).map(q => q.id);
        if (missingImageIds.length === 0) return;
        
        const newImages = {};
        await Promise.all(missingImageIds.map(async (id) => {
            try {
                const images = await Data.questions.getImages(id);
                if (images && images.length > 0) {
                    newImages[id] = images;
                }
            } catch (e) { console.error(`Failed to fetch images for question ${id}`, e); }
        }));
        
        if (Object.keys(newImages).length > 0) {
            this.setState(prevState => ({
                questionImagesMap: { ...prevState.questionImagesMap, ...newImages }
            }), this.refreshCurrentSelectionsAndFilters); // Refresh filters to apply images
        }
    };

    refreshCurrentSelectionsAndFilters = () => { 
        if (this.state.isLoading) return; 
        const { _masterGradesList, school, selectedGrade, gradeSearchTerm, selectedSubject, subjectSearchTerm, selectedTopic, topicSearchTerm, selectedSubtopic, subtopicSearchTerm, selectedQuestion, questionSearchTerm, optionSearchTerm, questionImagesMap } = this.state; 
        let newState = {}; 

        // Filter and sort Grades
        const gradesListRaw = this._sortListByOrderArray(_masterGradesList, school?.gradeOrder);
        const gradesList = gradesListRaw.filter(g => g.name && !g.isDeleted); // ONLY show if it has a name and not deleted
        newState.grades = this._applyFilter(gradesList, gradeSearchTerm, 'name'); 

        const currentGradeObj = selectedGrade ? _masterGradesList.find(g => g.id === selectedGrade) : null; 
        
        // Filter and sort Subjects
        const subjectsListRaw = this._sortListByOrderArray(currentGradeObj?.subjects, currentGradeObj?.subjectsOrder); 
        let subjectsList = subjectsListRaw.filter(s => s.name && !s.isDeleted);
        
        const userDataObj = JSON.parse(localStorage.getItem("user") || "{}");
        const isUserTeacher = userDataObj?.userType === 'teacher' || userDataObj?.role === 'teacher' || userDataObj?.userType === 'Teacher';
        const teachersData = Data.teachers.list() || [];
        
        if (isUserTeacher) {
            subjectsList = subjectsList.filter(s => s.teacher === userDataObj.id)
                                       .map(s => ({ ...s, displayName: s.name }));
        } else {
            subjectsList = subjectsList.map(s => {
                const teacherObj = teachersData.find(t => t.id === s.teacher);
                const teacherName = teacherObj ? (teacherObj.name || teacherObj.names) : 'Unassigned';
                return { ...s, displayName: `${s.name} <span style="font-size: 0.75rem; color: #64748b; margin-left: 8px; font-weight: normal; background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">👤 ${teacherName}</span>` };
            });
        }
        
        newState.filteredSubjects = this._applyFilter(subjectsList, subjectSearchTerm, 'name'); 
        
        const currentSubjectObj = selectedSubject ? (currentGradeObj?.subjects || []).find(s => s.id === selectedSubject) : null; 
        
        // Filter and sort Topics
        const topicsListRaw = this._sortListByOrderArray(currentSubjectObj?.topics, currentSubjectObj?.topicsOrder); 
        const topicsList = topicsListRaw.filter(t => t.name && !t.isDeleted);
        newState.filteredTopics = this._applyFilter(topicsList, topicSearchTerm, 'name'); 
        
        const currentTopicObj = selectedTopic ? (currentSubjectObj?.topics || []).find(t => t.id === selectedTopic) : null; 
        
        // Filter and sort Subtopics
        const subtopicsListRaw = this._sortListByOrderArray(currentTopicObj?.subtopics, currentTopicObj?.subtopicOrder); 
        const subtopicsList = subtopicsListRaw.filter(st => st.name && !st.isDeleted);
        newState.filteredSubtopics = this._applyFilter(subtopicsList, subtopicSearchTerm, 'name'); 
        
        const currentSubtopicObj = selectedSubtopic ? (currentTopicObj?.subtopics || []).find(st => st.id === selectedSubtopic) : null; 
        
        // Process questions with images
        const questionsListRaw = this._sortListByOrderArray(currentSubtopicObj?.questions, currentSubtopicObj?.questionsOrder); 
        const questionsList = questionsListRaw.filter(q => q.name && !q.isDeleted).map(q => ({ ...q, images: questionImagesMap[q.id] || [] }));
        newState.filteredQuestions = this._applyFilter(questionsList, questionSearchTerm, 'name'); 
        
        const currentQuestionObj = selectedQuestion ? (currentSubtopicObj?.questions || []).find(q => q.id === selectedQuestion) : null; 
        
        // Filter and sort Options (use 'value' instead of 'name')
        const optionsListRaw = this._sortListByOrderArray(currentQuestionObj?.options, currentQuestionObj?.optionsOrder); 
        const optionsList = optionsListRaw.filter(o => o.value && !o.isDeleted);
        newState.filteredOptions = this._applyFilter(optionsList, optionSearchTerm, 'value'); 

        this.setState(newState, () => {
            // Trigger fetch for displayed questions if we have any
            if (newState.filteredQuestions && newState.filteredQuestions.length > 0) {
                this.fetchQuestionImages(newState.filteredQuestions);
            }
        }); 
    };
    clearSelectionsAndDataFromLevel = (levelName) => { const newState = {}; const levels = ['grade', 'subject', 'topic', 'subtopic', 'question', 'option']; const startIndex = levels.indexOf(levelName); if (startIndex === -1) return {}; if (startIndex <= 1) { newState.activeTab = 'planning'; newState.selectedUserId = null; newState.selectedAttemptId = null; } for (let i = startIndex; i < levels.length; i++) { const level = levels[i]; const capitalizedLevel = level.charAt(0).toUpperCase() + level.slice(1); newState[`selected${capitalizedLevel}`] = null; const childIndex = i + 1; if (childIndex < levels.length) { const childLevel = levels[childIndex]; const capitalizedChildLevel = childLevel.charAt(0).toUpperCase() + childLevel.slice(1); newState[`filtered${capitalizedChildLevel}s`] = []; } } return newState; };
    
    // --- Event Handlers (CRUD, Select, Search) ---
    onEntityCreated = (entityName) => { toastr.success(`${entityName} CREATED successfully!`); }
    onEntityUpdated = (entityName) => { toastr.success(`${entityName} UPDATED successfully!`); }
    onEntityDeleted = (entityName) => { toastr.success(`${entityName} DELETED successfully!`); }
    onGradeSearch = e => { this.setState({ gradeSearchTerm: e.target.value }, this.refreshCurrentSelectionsAndFilters); }
    onSubjectSearch = e => { this.setState({ subjectSearchTerm: e.target.value }, this.refreshCurrentSelectionsAndFilters); }
    onTopicSearch = e => { this.setState({ topicSearchTerm: e.target.value }, this.refreshCurrentSelectionsAndFilters); }
    onSubtopicSearch = e => { this.setState({ subtopicSearchTerm: e.target.value }, this.refreshCurrentSelectionsAndFilters); }
    onQuestionSearch = e => { this.setState({ questionSearchTerm: e.target.value }, this.refreshCurrentSelectionsAndFilters); }
    onOptionSearch = e => { this.setState({ optionSearchTerm: e.target.value }, this.refreshCurrentSelectionsAndFilters); }
    handleGradeSelect = (gradeId) => { this.setState({ ...this.clearSelectionsAndDataFromLevel('grade'), selectedGrade: gradeId }, () => { this.refreshCurrentSelectionsAndFilters(); this.scrollBy(400); }); }
    handleSubjectSelect = (subjectId) => { this.setState({ ...this.clearSelectionsAndDataFromLevel('subject'), selectedSubject: subjectId }, () => { this.refreshCurrentSelectionsAndFilters(); if (subjectId) this.processLessonAttemptsForSubject(subjectId); this.scrollBy(1000); }); }
    handleTopicSelect = (topicId) => { this.setState({ ...this.clearSelectionsAndDataFromLevel('topic'), selectedTopic: topicId }, () => { this.refreshCurrentSelectionsAndFilters(); this.scrollToSub(400); }); }
    handleSubtopicSelect = (subtopicId) => { this.setState({ ...this.clearSelectionsAndDataFromLevel('subtopic'), selectedSubtopic: subtopicId }, () => { this.refreshCurrentSelectionsAndFilters(); this.scrollToSub(800); }); }
    handleQuestionSelect = (questionId) => { this.setState({ selectedQuestion: questionId }, () => { this.refreshCurrentSelectionsAndFilters(); this.scrollToSub(1200); }); }
    
    scrollToSub = (amount) => {
        const scroller = document.querySelector('.tab-inner-scroller');
        if (scroller) scroller.scrollTo({ left: amount, behavior: 'smooth' });
    }

    scrollToStart = () => { if (this.scrollContainerRef.current) this.scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' }); }
    scrollToEnd = () => { if (this.scrollContainerRef.current) this.scrollContainerRef.current.scrollTo({ left: this.scrollContainerRef.current.scrollWidth, behavior: 'smooth' }); }
    
    // --- Attempts Tab Logic ---
    processLessonAttemptsForSubject = (subjectId) => {
        const { _masterGradesList, selectedGrade, allLessonAttempts } = this.state;
        const grade = _masterGradesList.find(g => g.id === selectedGrade);
        const subject = (grade?.subjects || []).find(s => s.id === subjectId);
        if (!subject) { this.setState({ subjectLessonAttempts: [], usersWithAttempts: [] }); return; }
        const subtopicIdsInSubject = new Set((subject.topics || []).flatMap(t => (t.subtopics || []).map(st => st.id)));
        const attemptsForSubject = allLessonAttempts.filter(attempt => subtopicIdsInSubject.has(attempt.lessonId));
        const parentMap = new Map();
        const users = Data.parents.list();
        attemptsForSubject.forEach(attempt => { if (!parentMap.has(attempt.userId)) { const user = users.find(p => p.id === attempt.userId); if (user) { parentMap.set(user.id, { id: user.id, name: user.name || `User ${user.id.substring(0, 5)}`, students: user.students || [], }); } } });
        this.setState({ subjectLessonAttempts: attemptsForSubject, usersWithAttempts: Array.from(parentMap.values()), selectedUserId: null, selectedAttemptId: null });
    }

    handleDeleteAttempt = async (attempt) => { if (!window.confirm(`Are you sure you want to delete this attempt? This action cannot be undone.`)) return; try { await Data.lessonAttempts.delete({ id: attempt.id }); toastr.success("Session deleted successfully!"); if (this.state.selectedAttemptId === attempt.id) { this.setState({ selectedAttemptId: null }); } } catch (e) { toastr.error("Failed to delete attempt."); console.error("Delete attempt error:", e); } };
    handleTabChange = (tabName) => { this.setState({ activeTab: tabName }); }
    handleUserSelect = (userId) => { this.setState({ selectedUserId: userId, selectedAttemptId: null }); }
    handleAttemptSelect = (attemptId) => { this.setState({ selectedAttemptId: attemptId }); }
    
    // --- Utilities & Generic Handlers ---
    findLessonById = (lessonId) => { for (const grade of this.state._masterGradesList) { for (const subject of grade.subjects || []) { for (const topic of subject.topics || []) { const subtopic = (topic.subtopics || []).find(st => st.id === lessonId); if (subtopic) return subtopic; } } } return null; }
    _applyFilter = (list, term, key = 'name') => { if (!list) return []; const searchTerm = term.toLowerCase().trim(); if (!searchTerm) return list; return list.filter(item => item && item[key] && String(item[key]).toLowerCase().includes(searchTerm)); };
    _sortListByOrderArray = (list, orderArray) => { if (!list || !Array.isArray(list)) return []; if (!orderArray || !Array.isArray(orderArray)) return list; const orderMap = new Map(orderArray.map((id, index) => [id, index])); return [...list].sort((a, b) => (orderMap.get(a.id) ?? Infinity) - (orderMap.get(b.id) ?? Infinity)); };
    handleCreate = async (entity, data, parentId, parentKey) => { try { const payload = parentId ? { ...data, [parentKey]: parentId } : data; const result = await Data[entity].create(payload); this.onEntityCreated(entity.slice(0, -1)); return result; } catch (err) { toastr.error(`Failed to create ${entity.slice(0, -1)}`); throw err; } };
    handleUpdate = async (entity, payload) => { try { const result = await Data[entity].update(payload); this.onEntityUpdated(entity.slice(0, -1)); return result; } catch (err) { toastr.error(`Failed to update ${entity.slice(0, -1)}`); throw err; } };
    handleDelete = (entity, item) => async () => { try { await Data[entity].delete({ id: item.id }); this.onEntityDeleted(entity.slice(0, -1)); const singularEntity = entity.slice(0, -1); const capitalizedEntity = singularEntity.charAt(0).toUpperCase() + singularEntity.slice(1); if (this.state[`selected${capitalizedEntity}`] === item.id) { this.setState(this.clearSelectionsAndDataFromLevel(singularEntity), this.refreshCurrentSelectionsAndFilters); } else { this.refreshCurrentSelectionsAndFilters(); } } catch (err) { toastr.error(`Failed to delete ${entity.slice(0, -1)}`); throw err; } };
    scrollBy = (amount) => { if (this.scrollContainerRef.current) { this.scrollContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' }); } }
    _handleReorder = async (entityType, reorderedList) => { const { school, selectedGrade, selectedSubject, selectedTopic, selectedSubtopic, selectedQuestion } = this.state; const ids = reorderedList.map(item => item.id); let entityToUpdate, payload; switch (entityType) { case 'grades': this.setState({ grades: reorderedList }); entityToUpdate = 'schools'; payload = { id: school.id, gradeOrder: ids }; break; case 'subjects': this.setState({ filteredSubjects: reorderedList }); entityToUpdate = 'grades'; payload = { id: selectedGrade, subjectsOrder: ids }; break; case 'topics': this.setState({ filteredTopics: reorderedList }); entityToUpdate = 'subjects'; payload = { id: selectedSubject, topicsOrder: ids, grade: selectedGrade }; break; case 'subtopics': this.setState({ filteredSubtopics: reorderedList }); entityToUpdate = 'topics'; payload = { id: selectedTopic, subtopicOrder: ids, subject: selectedSubject }; break; case 'questions': this.setState({ filteredQuestions: reorderedList }); entityToUpdate = 'subtopics'; payload = { id: selectedSubtopic, questionsOrder: ids, topic: selectedTopic }; break; case 'options': this.setState({ filteredOptions: reorderedList }); entityToUpdate = 'questions'; payload = { id: selectedQuestion, optionsOrder: ids, subtopic: selectedSubtopic }; break; default: return; } try { await this.handleUpdate(entityToUpdate, payload); } catch (error) { toastr.error(`Failed to update order for ${entityType}. Reverting.`); this.refreshCurrentSelectionsAndFilters(); } };
    
    // --- Render Methods ---

    renderAnswerDetails = (question, event) => {
        if (!event || !event.userAnswer) return null;
        let answer;
        try { 
            answer = typeof event.userAnswer === 'string' ? JSON.parse(event.userAnswer) : event.userAnswer; 
        } catch(e) { 
            return <div className="text-danger">Error parsing answer data.</div> 
        }

        switch (question.type) {
            case 'SINGLECHOICE': case 'MULTICHOICE':
                const selectedIds = new Set(answer.selectedOptionIds || [answer.selectedOptionId].filter(Boolean));
                return (
                    <div className="answer-details">
                        {(question.options || []).map(option => {
                            const isSelected = selectedIds.has(option.id);
                            const isCorrect = option.correct;
                            let className = 'option-display';
                            let icon = 'la-circle-thin';
                            if (isCorrect && isSelected) { className += ' selected-correct'; icon = 'la-check-circle'; }
                            else if (isCorrect) { className += ' correct'; icon = 'la-check-circle-o'; }
                            else if (isSelected && !isCorrect) { className += ' selected-incorrect'; icon = 'la-times-circle'; }
                            return (<div key={option.id} className={className}><i className={`la ${icon}`}></i> {option.value}</div>);
                        })}
                    </div>
                );
            case 'TEXT': 
                return (
                    <div className="answer-details">
                        <div className="text-answer">
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>Student Answer</div>
                            <div style={{ fontSize: '0.9rem', color: '#1e293b' }}>{answer.inputText || 'No text provided.'}</div>
                        </div>
                    </div>
                );
            case 'CAMERA': 
                return (
                    <div className="answer-details image-answer">
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>Uploaded Submission</div>
                        {answer.imageData ? 
                            <img src={answer.imageData} alt="Student submission" onClick={() => window.open(answer.imageData, '_blank')} title="Click to view full size" /> 
                            : <div className="text-muted italic">No image was captured.</div>
                        }
                    </div>
                );
            case 'INFORMATION':
                return <div className="answer-details"><div className="text-muted small italic">Informational content - no answer required.</div></div>;
            default: 
                return <div className="answer-details"><p className="text-muted small">Display details for {question.type} coming soon.</p></div>;
        }
    }
    
    renderEventsForQuestion = (question, events) => {
        if (!events || events.length === 0) return <div className="p-4 text-center text-muted italic small border-top">This question was not reached or was skipped.</div>;
        const maxPoints = question.points || 5; 
        
        return (
            <div className="attempt-events-timeline">
                {events.map((event, idx) => {
                    const eventTime = moment(event.eventTimestamp);
                    if (event.eventType === 'check_attempt') {
                        const isCorrect = event.isCorrect;
                        const pointsEarned = typeof event.pointsEarned === 'number' ? event.pointsEarned : (isCorrect ? maxPoints : 0);
                        return (
                            <div key={event.id || idx} className="attempt-event-item">
                                <div className={`attempt-event-icon ${isCorrect ? 'correct' : 'incorrect'}`}>
                                    <i className={`la ${isCorrect ? 'la-check' : 'la-times'}`}></i>
                                </div>
                                <div className="attempt-event-details">
                                    <div className="attempt-event-header">
                                        <span className="attempt-event-title">Attempt #{events.filter((e, i) => i <= idx && e.eventType === 'check_attempt').length}</span>
                                        <div className="attempt-event-meta">
                                            <span className="attempt-event-points"><i className="la la-diamond"></i> {pointsEarned}/{maxPoints}</span>
                                            <span title={eventTime.format('lll')}>{eventTime.fromNow()}</span>
                                        </div>
                                    </div>
                                    <div className="attempt-event-body">
                                        {this.renderAnswerDetails(question, event)}
                                    </div>
                                </div>
                            </div>
                        );
                    }
                    if (event.eventType === 'question_viewed' && idx === 0) {
                        return (
                            <div key={event.id || idx} className="attempt-event-item" style={{ opacity: 0.6, padding: '0.5rem 0' }}>
                                <div className="attempt-event-icon" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}><i className="la la-eye"></i></div>
                                <div className="attempt-event-details">
                                    <div className="attempt-event-header">
                                        <span className="attempt-event-title" style={{ fontSize: '0.75rem' }}>First Viewed</span>
                                        <div className="attempt-event-meta">
                                            <span title={eventTime.format('lll')}>{eventTime.fromNow()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    }
                    return null;
                })}
            </div>
        );
    }

    renderContentColumns() {
        const { grades, gradeSearchTerm, filteredSubjects, subjectSearchTerm, selectedGrade, selectedSubject, _masterGradesList, isLoading } = this.state;
        const userData = JSON.parse(localStorage.getItem("user") || "{}");
        const isTeacher = userData?.userType === 'teacher' || userData?.role === 'teacher' || userData?.userType === 'Teacher';
        const tableOptions = { reorderable: !isTeacher, linkable: true, editable: !isTeacher, deleteable: !isTeacher };
        const selectedGradeObj = selectedGrade ? _masterGradesList.find(g => g.id === selectedGrade) : null;

        // Smart loading: only show skeletons if the source is undefined (not fetched yet) 
        // AND we are in the initial loading phase. If array is empty [], it means "No Data", not "Loading"
        const gradesLoading = isLoading && grades.length === 0;
        const subjectsLoading = selectedGrade && selectedGradeObj?.subjects === undefined && filteredSubjects.length === 0;

        return <>
            <div className="cm-column">
                <div className="cm-column-header">
                    <h5>Grades / Levels</h5>
                    {!isTeacher && <button type="button" className="cm-add-btn" onClick={() => this.addGradeModalRef.current.show()} title="Add Grade"><i className="la la-plus"></i></button>}
                </div>
                <div className="cm-column-body">
                    <Search title="grades" onSearch={this.onGradeSearch} value={gradeSearchTerm} />
                    <Table listId="grades-list" headers={[{ label: "Name", key: "name" }]} data={grades} selectedItemId={selectedGrade} show={grade => this.handleGradeSelect(grade.id)} edit={grade => this.setState({ gradeToEdit: grade }, () => this.editGradeModalRef.current.show())} delete={grade => this.setState({ gradeToDelete: grade }, () => this.deleteGradeModalRef.current.show())} onOrderChange={(list) => this._handleReorder('grades', list)} options={tableOptions} noItemsText="No grades found." isLoading={gradesLoading} onAdd={!isTeacher ? () => this.addGradeModalRef.current.show() : null} addItemText={!isTeacher ? "Add Grade" : null} />
                </div>
            </div>
            {selectedGrade && (
                <div className="cm-column">
                    <div className="cm-column-header"><h5>{selectedGradeObj?.name || '...'} Subjects</h5>{!isTeacher && <button type="button" className="cm-add-btn" onClick={() => this.addSubjectModalRef.current.show()} title="Add Subject"><i className="la la-plus"></i></button>}</div>
                    <div className="cm-column-body">
                        <Search title="subjects" onSearch={this.onSubjectSearch} value={subjectSearchTerm} />
                        <Table listId={`subjects-list-${selectedGrade}`} headers={[{ label: "Name", key: "displayName" }]} data={filteredSubjects} options={tableOptions} selectedItemId={selectedSubject} show={subject => this.handleSubjectSelect(subject.id)} edit={subject => this.setState({ subjectToEdit: subject }, () => this.editSubjectModalRef.current.show())} delete={subject => this.setState({ subjectToDelete: subject }, () => this.deleteSubjectModalRef.current.show())} onOrderChange={(list) => this._handleReorder('subjects', list)} isLoading={subjectsLoading} onAdd={!isTeacher ? () => this.addSubjectModalRef.current.show() : null} addItemText={!isTeacher ? "Add Subject" : null} />
                    </div>
                </div>
            )}
            {selectedSubject && this.renderMainContentArea()}
        </>;
    }

    renderMainContentArea() {
        const { activeTab, filteredTopics, selectedTopic, filteredSubtopics, selectedSubtopic, filteredQuestions, selectedQuestion, filteredOptions, selectedSubject, selectedGrade, topicSearchTerm, subtopicSearchTerm, questionSearchTerm, optionSearchTerm } = this.state;
        const userData = JSON.parse(localStorage.getItem("user") || "{}");
        const isTeacher = userData?.userType === 'teacher' || userData?.role === 'teacher' || userData?.userType === 'Teacher';
        const tableOptions = { reorderable: true, linkable: true, editable: true, deleteable: true };
        const correctOptionIds = filteredOptions.filter(o => o.correct).map(o => o.id);
        
        const currentGradeObj = selectedGrade ? this.state._masterGradesList.find(g => g.id === selectedGrade) : null;
        const currentSubjectObj = selectedSubject ? (currentGradeObj?.subjects || []).find(s => s.id === selectedSubject) : null;
        const currentTopicObj = selectedTopic ? (currentSubjectObj?.topics || []).find(t => t.id === selectedTopic) : null;
        const currentSubtopicObj = selectedSubtopic ? (currentTopicObj?.subtopics || []).find(st => st.id === selectedSubtopic) : null;
        const currentQuestionObj = selectedQuestion ? (currentSubtopicObj?.questions || []).find(q => q.id === selectedQuestion) : null;

        const topicsLoading = selectedSubject && currentSubjectObj?.topics === undefined && filteredTopics.length === 0;
        const subtopicsLoading = selectedTopic && currentTopicObj?.subtopics === undefined && filteredSubtopics.length === 0;
        const questionsLoading = selectedSubtopic && currentSubtopicObj?.questions === undefined && filteredQuestions.length === 0;
        const optionsLoading = selectedQuestion && currentQuestionObj?.options === undefined && filteredOptions.length === 0;

        return (
            <div className="cm-column cm-column-large" style={{ minWidth: '800px', flexGrow: 4, display: 'flex', flexDirection: 'column' }}>
                <div className="cm-tab-header">
                    <button className={`cm-tab-btn ${activeTab === 'planning' ? 'active' : ''}`} onClick={() => this.handleTabChange('planning')}>
                        <i className="la la-pencil-square-o" style={{ marginRight: '8px' }}></i> Schemes & Planning
                    </button>
                    <button className={`cm-tab-btn ${activeTab === 'content' ? 'active' : ''}`} onClick={() => this.handleTabChange('content')}>
                        <i className="la la-book" style={{ marginRight: '8px' }}></i> Content & Strands
                    </button>
                    <button className={`cm-tab-btn ${activeTab === 'responses' ? 'active' : ''}`} onClick={() => this.handleTabChange('responses')}>
                        <i className="la la-users" style={{ marginRight: '8px' }}></i> Student Activity
                    </button>
                    
                    {/* Integrated Term Selector + Print */}
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', paddingRight: '1rem' }}>
                        <div className="d-flex align-items-center" style={{ background: '#f8fafc', padding: '2px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', height: '32px' }}>
                            <i className="la la-calendar" style={{ color: '#64748b', marginRight: '6px', fontSize: '0.9rem' }}></i>
                            <select 
                                className="form-control form-control-sm border-0 bg-transparent font-weight-bold" 
                                style={{ minWidth: '120px', cursor: 'pointer', color: '#1e293b', fontSize: '0.8rem', padding: 0, height: 'auto' }}
                                value={this.state.selectedTermId || ''}
                                onChange={(e) => this.setState({ selectedTermId: e.target.value }, this.refreshPlanningFilters)}
                            >
                                {this.state.terms.length === 0 && <option value="">No Terms Found</option>}
                                {this.state.terms.map(term => (
                                    <option key={term.id} value={term.id}>{term.name}</option>
                                ))}
                            </select>
                        </div>
                        {activeTab === 'planning' && (
                            <button 
                                className="btn btn-outline-secondary btn-sm d-flex align-items-center" 
                                style={{ height: '32px', borderRadius: '8px', fontSize: '0.8rem' }}
                                onClick={this.handlePrintPlanning}
                            >
                                <i className="la la-print mr-1"></i> Print
                            </button>
                        )}
                    </div>
                </div>
                <div className="tab-content">
                    <div className={`tab-pane ${activeTab === 'content' ? 'active' : ''}`}>
                        <div className="tab-inner-scroller">
                            <div className="cm-sub-column">
                                <div className="cm-column-header"><h5>Strands</h5><button type="button" className="cm-add-btn" onClick={() => this.addTopicModalRef.current.show()} title="Add Strand"><i className="la la-plus"></i></button></div>
                                <div className="cm-column-body">
                                    <Search title="strands" onSearch={this.onTopicSearch} value={topicSearchTerm} />
                                    <Table listId={`topics-list-${selectedSubject}`} headers={[{ label: "Name", key: "name" }]} data={filteredTopics} options={tableOptions} selectedItemId={selectedTopic} show={topic => this.handleTopicSelect(topic.id)} edit={topic => this.setState({ topicToEdit: topic }, () => this.editTopicModalRef.current.show())} delete={topic => this.setState({ topicToDelete: topic }, () => this.deleteTopicModalRef.current.show())} onOrderChange={(list) => this._handleReorder('topics', list)} isLoading={topicsLoading} onAdd={() => this.addTopicModalRef.current.show()} addItemText="Add Strand" />
                                </div>
                            </div>
                             {selectedTopic && (
                                <div className="cm-sub-column">
                                    <div className="cm-column-header"><h5>Sub Strands</h5><button type="button" className="cm-add-btn" onClick={() => this.addSubtopicModalRef.current.show()} title="Add Sub Strand"><i className="la la-plus"></i></button></div>
                                    <div className="cm-column-body">
                                        <Search title="sub-strands" onSearch={this.onSubtopicSearch} value={subtopicSearchTerm} />
                                        <Table listId={`subtopics-list-${selectedTopic}`} headers={[{ label: "Name", key: "name" }]} data={filteredSubtopics} options={tableOptions} selectedItemId={selectedSubtopic} show={subtopic => this.handleSubtopicSelect(subtopic.id)} edit={subtopic => this.setState({ subtopicToEdit: subtopic }, () => this.editSubtopicModalRef.current.show())} delete={subtopic => this.setState({ subtopicToDelete: subtopic }, () => this.deleteSubtopicModalRef.current.show())} onOrderChange={(list) => this._handleReorder('subtopics', list)} isLoading={subtopicsLoading} onAdd={() => this.addSubtopicModalRef.current.show()} addItemText="Add Sub Strand" />
                                    </div>
                                </div>
                            )}
                            {selectedSubtopic && (
                                <div className="cm-sub-column" style={{ width: '450px' }}>
                                    <div className="cm-column-header"><h5>Questions</h5><button type="button" className="cm-add-btn" onClick={() => this.addQuestionModalRef.current.show()} title="Add Question"><i className="la la-plus"></i></button></div>
                                    <div className="cm-column-body">
                                        <Search title="questions" onSearch={this.onQuestionSearch} value={questionSearchTerm} />
                                        <Table listId={`questions-list-${selectedSubtopic}`} headers={[{ label: "Name", key: "name" }]} data={filteredQuestions} options={tableOptions} selectedItemId={selectedQuestion} show={question => this.handleQuestionSelect(question.id)} edit={question => this.setState({ questionToEdit: question }, () => this.editQuestionModalRef.current.show())} delete={question => this.setState({ questionToDelete: question }, () => this.deleteQuestionModalRef.current.show())} onOrderChange={(list) => this._handleReorder('questions', list)} isLoading={questionsLoading} onAdd={() => this.addQuestionModalRef.current.show()} addItemText="Add Question" />
                                    </div>
                                </div>
                            )}
                            {selectedQuestion && (
                                <div className="cm-sub-column">
                                    <div className="cm-column-header"><h5>Options</h5><button type="button" className="cm-add-btn" onClick={() => this.addOptionModalRef.current.show()} title="Add Option"><i className="la la-plus"></i></button></div>
                                    <div className="cm-column-body">
                                        <Search title="options" onSearch={this.onOptionSearch} value={optionSearchTerm} />
                                        <Table listId={`options-list-${selectedQuestion}`} headers={[{ label: "Answer", key: "value" }]} data={filteredOptions} options={{ ...tableOptions, linkable: false }} edit={option => this.setState({ optionToEdit: option }, () => this.editOptionModalRef.current.show())} delete={option => this.setState({ optionToDelete: option }, () => this.deleteOptionModalRef.current.show())} onOrderChange={(list) => this._handleReorder('options', list)} correctItemIds={correctOptionIds} isLoading={optionsLoading} onAdd={() => this.addOptionModalRef.current.show()} addItemText="Add Option" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className={`tab-pane ${activeTab === 'responses' ? 'active' : ''}`}>
                        {this.renderStudentAttemptsTab()}
                    </div>
                    <div className={`tab-pane ${activeTab === 'planning' ? 'active' : ''}`}>
                        {this.renderTeacherPlanningTab()}
                    </div>
                </div>
            </div>
        );
    }
    
    renderStudentAttemptsTab() {
        const { usersWithAttempts, selectedUserId, subjectLessonAttempts, selectedAttemptId } = this.state;
        const selectedUserName = selectedUserId ? usersWithAttempts.find(u => u.id === selectedUserId)?.name : null;
        const attemptsForSelectedUser = selectedUserId ? subjectLessonAttempts.filter(a => a.userId === selectedUserId) : [];
        const selectedAttempt = selectedAttemptId ? subjectLessonAttempts.find(a => a.id === selectedAttemptId) : null;
        
        let originalLesson, sortedOriginalQuestions, attemptEventsByQuestionId;
        if (selectedAttempt) {
            originalLesson = this.findLessonById(selectedAttempt.lessonId);
            if (originalLesson) {
                sortedOriginalQuestions = this._sortListByOrderArray(originalLesson.questions, originalLesson.questionsOrder);
                attemptEventsByQuestionId = (selectedAttempt.attemptEvents || []).reduce((acc, event) => {
                    if (!acc.has(event.questionId)) acc.set(event.questionId, []);
                    acc.get(event.questionId).push(event);
                    return acc;
                }, new Map());
            }
        }
    
        return (
            <div className="attempts-grid">
                <div className="attempts-column">
                    <h6>Students ({usersWithAttempts.length})</h6>
                    <div className="list-group">{usersWithAttempts.length > 0 ? usersWithAttempts.map(user => (
                        <div key={user.id} className={`list-group-item user-list-item ${selectedUserId === user.id ? 'active' : ''}`} onClick={() => this.handleUserSelect(user.id)}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: selectedUserId === user.id ? '#fff' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '0.8rem' }}>{user.name.charAt(0)}</div>
                                <div>
                                    <div style={{ fontSize: '0.9rem', color: selectedUserId === user.id ? '#1e293b' : '#334155', fontWeight: selectedUserId === user.id ? 700 : 500 }}>{user.name}</div>
                                    <div className="student-list-metadata" style={{ marginTop: '4px' }}>
                                        {user.students && user.students.map(student => (
                                            <div key={student.id} className="student-sub-item">
                                                <i className="la la-user-graduate" style={{ fontSize: '0.8rem' }}></i>
                                                <span>{student.names}</span>
                                                {student.registration && <span className="student-reg-badge">{student.registration}</span>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>)) : (<div className="text-center p-5 text-muted"><i className="la la-users" style={{fontSize: '3rem', opacity: 0.2, marginBottom: '1rem'}}></i><br/>No student activity found yet.</div>)
                    }</div>
                </div>
                <div className="attempts-column">
                    <h6>{selectedUserName ? `Attempts: ${selectedUserName}` : 'Activity History'}</h6>
                    {selectedUserId && (<div className="list-group">{attemptsForSelectedUser.length > 0 ? attemptsForSelectedUser.map((attempt, index) => (
                        <div key={attempt.id} className={`list-group-item ${selectedAttemptId === attempt.id ? 'active' : ''}`} onClick={() => this.handleAttemptSelect(attempt.id)}>
                            <div className="attempt-list-item-content">
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: selectedAttemptId === attempt.id ? 'var(--cm-primary-color)' : '#1e293b' }}>Submission {attemptsForSelectedUser.length - index}</div>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}><i className="la la-calendar"></i> {moment(attempt.startedAt).format('MMM D, h:mm a')}</div>
                                    <div style={{ fontSize: '0.75rem', marginTop: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <i className="la la-book-open" style={{ color: 'var(--cm-primary-color)' }}></i>
                                        <span>{this.findLessonById(attempt.lessonId)?.name || '...'}</span>
                                    </div>
                                </div>
                                <div className={`attempt-score-badge ${attempt.finalScore >= 50 ? 'high-score' : 'low-score'}`}>
                                    {attempt.finalScore}%
                                </div>
                            </div>
                        </div>)) : <div className="text-center p-5 text-muted">No submissions found.</div>}
                    </div>)}
                </div>
                <div className="attempts-column">
                    <h6>{selectedAttempt ? `Reviewing Submission` : 'Submission Review'}</h6>
                    {selectedAttempt ? (
                        <div className="attempt-details-container">
                            <div className="card-custom glass-panel p-4 mb-4" style={{ borderRadius: '16px', border: '1px solid #e2e8f0', background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                                <h6 style={{ padding: 0, marginBottom: '15px', textTransform: 'uppercase', color: '#64748b', fontSize: '0.75rem', fontWeight: 800, border: 'none' }}>Performance Summary</h6>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: selectedAttempt.finalScore >= 50 ? '#f0fdf4' : '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <i className={`la ${selectedAttempt.finalScore >= 50 ? 'la-trophy' : 'la-info-circle'}`} style={{ fontSize: '1.2rem', color: selectedAttempt.finalScore >= 50 ? '#16a34a' : '#e11d48' }}></i>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Final Score</div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>{selectedAttempt.finalScore}%</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <i className="la la-clock" style={{ fontSize: '1.2rem', color: '#64748b' }}></i>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Time Spent</div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>{moment.duration(moment(selectedAttempt.updatedAt).diff(moment(selectedAttempt.startedAt))).humanize()}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {originalLesson && sortedOriginalQuestions ? sortedOriginalQuestions.map(q => (
                                <div key={q.id} className="attempt-details-card">
                                    <div style={{ backgroundColor: '#fafbfd', padding: '10px 0' }}>
                                        <Table data={[q]} headers={[{key: 'name'}]} options={{reorderable: false, linkable: false, editable: false, deleteable: false}} listId={`q-disp-${q.id}`} />
                                    </div>
                                    {this.renderEventsForQuestion(q, attemptEventsByQuestionId.get(q.id))}
                                </div>
                            )) : <div className="alert alert-light border text-center">Could not reconstruct lesson history.</div>}
                        </div>
                    ) : (usersWithAttempts.length > 0 && !selectedUserId ? <div className="text-center p-5 text-muted" style={{marginTop: '10%'}}><i className="la la-arrow-left" style={{fontSize: '3rem', opacity: 0.1, marginBottom: '1rem'}}></i><br/>Select a student to view their work.</div> : null)}
                </div>
            </div>
        );
    }

    renderHeader() {
        const { school, terms, selectedTermId } = this.state;
        return (
            <div className="cm-header-main" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '1rem 1.5rem', borderRadius: '16px', border: '1px solid var(--cm-border-color)', marginBottom: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--cm-primary-bg-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="la la-school" style={{ fontSize: '1.5rem', color: 'var(--cm-primary-color)' }}></i>
                    </div>
                    <h3 style={{ margin: 0 }}>{school?.name || 'Curriculum Manager'}</h3>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div className="d-flex align-items-center" style={{ background: '#f8fafc', padding: '4px 12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        <i className="la la-calendar" style={{ color: '#64748b', marginRight: '8px' }}></i>
                        <select 
                            className="form-control form-control-sm border-0 bg-transparent font-weight-bold" 
                            style={{ minWidth: '140px', cursor: 'pointer', color: '#1e293b' }}
                            value={selectedTermId || ''}
                            onChange={(e) => this.setState({ selectedTermId: e.target.value }, this.refreshPlanningFilters)}
                        >
                            {terms.length === 0 && <option value="">No Terms Found</option>}
                            {terms.map(term => (
                                <option key={term.id} value={term.id}>{term.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        );
    }

    render() {
        const { isLoading, gradeToEdit, gradeToDelete, subjectToEdit, subjectToDelete, topicToEdit, topicToDelete, subtopicToEdit, subtopicToDelete, questionToEdit, questionToDelete, optionToEdit, optionToDelete, selectedGrade, selectedSubject, selectedTopic, selectedSubtopic, selectedQuestion } = this.state;

        if (isLoading) {
            return (<div className="cm-container"><div className="cm-header-main"></div><SkeletonLoader /></div>);
        }

        // --- Professional Print Preview Mode ---
        if (this.state.showPrintView && this.state.printData) {
            const { school, teacher, subject, grade, term, allSchemes, allLessonPlans, allRecords, allIep } = this.state.printData;

            return (
                <div className="kt-grid__item kt-grid__item--fluid kt-grid kt-grid--ver kt-page">
                    <div className="kt-grid__item kt-grid__item--fluid kt-grid kt-grid--hor kt-wrapper" id="kt_wrapper">
                        <Subheader links={["Curriculum", "Planning Print Preview"]} />
                        <style>{`
                            @media print {
                                /* Hide EVERY standard UI element */
                                .kt-header, .kt-header-mobile, .kt-aside, .kt-footer, .kt-subheader, 
                                .navbar, .d-print-none, .kt-subheader-search, #kt_header, #kt_aside, #kt_footer {
                                    display: none !important;
                                }

                                /* Reset all layout wrappers */
                                body, .kt-page, .kt-wrapper, .kt-content, .kt-body, #kt_wrapper, #kt_content {
                                    padding: 0 !important;
                                    margin: 0 !important;
                                    display: block !important;
                                    height: auto !important;
                                    min-height: 0 !important;
                                }

                                .kt-container {
                                    padding: 0 !important;
                                    margin: 0 !important;
                                    max-width: none !important;
                                    width: 100% !important;
                                    display: block !important;
                                }

                                #print-area {
                                    padding: 0 !important;
                                    margin: 0 !important;
                                    display: block !important;
                                    background-color: white !important;
                                    width: 100% !important;
                                }

                                @page {
                                    size: A4 landscape;
                                    margin: 0;
                                }
                            }
                        `}</style>
                        <div className="kt-content kt-grid__item kt-grid__item--fluid" style={{height:"auto"}} id="kt_content">
                            <div className="kt-container pt-4">
                                <div className="d-print-none p-4 mb-4 d-flex justify-content-between align-items-center bg-white rounded shadow-sm border">
                                    <button className="btn btn-secondary" onClick={this.togglePrintView}>
                                        <i className="la la-arrow-left"></i> Back to Planning
                                    </button>
                                    <div className="text-center">
                                        <h4 className="m-0 font-weight-bold">Teacher Planning Portfolio Preview</h4>
                                        <span className="text-muted small">Professional A4 Export Format</span>
                                    </div>
                                    <button className="btn btn-primary font-weight-bold" onClick={this.handlePrint}>
                                        <i className="la la-print mr-2"></i> Print Document
                                    </button>
                                </div>
                                <div id="print-area" style={{ backgroundColor: '#f3f4f6', paddingTop: '20px', paddingBottom: '20px', display: 'flex', justifyContent: 'center', overflowX: 'auto' }}>
                                    <PlanningPrintView 
                                        school={school}
                                        teacher={teacher}
                                        subject={subject}
                                        grade={grade}
                                        term={term}
                                        schemes={allSchemes}
                                        lessons={allLessonPlans}
                                        records={allRecords}
                                        iep={allIep}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }


        return (
            <div className="cm-container pt-0">
                {/* renderHeader removed to satisfy two-topbar limit */}
                
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                    <button onClick={() => this.scrollToStart()} className="btn btn-sm btn-icon btn-light mr-2" title="Scroll to Start"><i className="la la-angle-double-left"></i></button>
                    <div ref={this.scrollContainerRef} className="scrolling-wrapper" onScroll={this.saveStateToLocalStorage}>
                        {this.renderContentColumns()}
                    </div>
                    <button onClick={() => this.scrollToEnd()} className="btn btn-sm btn-icon btn-light ml-2" title="Scroll to End"><i className="la la-angle-double-right"></i></button>
                </div>

                {/* --- Modals --- */}
                {this.state.school && <AddGradeModal ref={this.addGradeModalRef} save={(data) => this.handleCreate('grades', { ...data, school: this.state.school.id })} />}
                {gradeToEdit.id && <EditGradeModal ref={this.editGradeModalRef} grade={gradeToEdit} edit={(data) => this.handleUpdate('grades', { ...data, id: gradeToEdit.id })} />}
                {gradeToDelete.id && <DeleteGradeModal ref={this.deleteGradeModalRef} grade={gradeToDelete} delete={this.handleDelete('grades', gradeToDelete)} />}
                {selectedGrade && <AddSubjectModal ref={this.addSubjectModalRef} save={(data) => this.handleCreate('subjects', data, selectedGrade, 'grade')} />}
                {subjectToEdit && <EditSubjectModal ref={this.editSubjectModalRef} subject={subjectToEdit} edit={(data) => this.handleUpdate('subjects', { ...data, id: subjectToEdit.id, grade: selectedGrade })} />}
                {subjectToDelete.id && <DeleteSubjectModal ref={this.deleteSubjectModalRef} subject={subjectToDelete} delete={this.handleDelete('subjects', subjectToDelete, selectedGrade, 'grade')} />}
                {selectedSubject && <AddTopicModal ref={this.addTopicModalRef} save={(data) => this.handleCreate('topics', data, selectedSubject, 'subject')} />}
                {selectedSubject && <EditTopicModal ref={this.editTopicModalRef} topic={topicToEdit} edit={(data) => this.handleUpdate('topics', { ...data, id: topicToEdit.id, subject: selectedSubject })} />}
                {selectedSubject && <DeleteTopicModal ref={this.deleteTopicModalRef} topic={topicToDelete} delete={this.handleDelete('topics', topicToDelete, selectedSubject, 'subject')} />}
                {selectedTopic && <AddSubtopicModal ref={this.addSubtopicModalRef} save={(data) => this.handleCreate('subtopics', data, selectedTopic, 'topic')} />}
                {selectedTopic && <EditSubtopicModal ref={this.editSubtopicModalRef} subtopic={subtopicToEdit} edit={(data) => this.handleUpdate('subtopics', { ...data, id: subtopicToEdit.id, topic: selectedTopic })} />}
                {selectedTopic && <DeleteSubtopicModal ref={this.deleteSubtopicModalRef} subtopic={subtopicToDelete} delete={this.handleDelete('subtopics', subtopicToDelete, selectedTopic, 'topic')} />}
                {selectedSubtopic && <AddQuestionModal ref={this.addQuestionModalRef} save={(data) => this.handleCreate('questions', data, selectedSubtopic, 'subtopic')} />}
                {selectedSubtopic && <EditQuestionModal ref={this.editQuestionModalRef} question={questionToEdit} edit={(data) => this.handleUpdate('questions', { ...data, id: questionToEdit.id, subtopic: selectedSubtopic })} />}
                {selectedSubtopic && <DeleteQuestionModal ref={this.deleteQuestionModalRef} question={questionToDelete} delete={this.handleDelete('questions', questionToDelete)} />}
                {selectedQuestion && <AddOptionModal ref={this.addOptionModalRef} save={(data) => this.handleCreate('options', data, selectedQuestion, 'question')} />}
                {selectedQuestion && <EditOptionModal ref={this.editOptionModalRef} option={optionToEdit} edit={(data) => this.handleUpdate('options', { ...data, id: optionToEdit.id, question: selectedQuestion })} />}
                {selectedQuestion && <DeleteOptionModal ref={this.deleteOptionModalRef} option={optionToDelete} delete={this.handleDelete('options', optionToDelete)} />}
            </div>
        );
    }
    renderTeacherPlanningTab() {
        const { planningSubTab, filteredSchemes, filteredRecords, filteredTopics, selectedTopic, filteredSubtopics, selectedSubtopic, topicSearchTerm, subtopicSearchTerm } = this.state;
        
        
        return (
            <div className="tab-inner-scroller">
                {/* Strands Column */}
                <div className="cm-sub-column" style={{ width: '320px' }}>
                    <div className="cm-column-header">
                        <h5 className="flex-grow-1"><i className="la la-layer-group mr-2"></i>Strands</h5>
                        <button className="cm-add-btn" onClick={() => this.addTopicModalRef.current.show()} title="Add Strand"><i className="la la-plus"></i></button>
                    </div>
                    <div className="cm-column-body">
                        <div className="cm-search-wrapper">
                            <i className="la la-search search-icon"></i>
                            <input type="text" className="form-control cm-search-input" placeholder="Search strands..." value={topicSearchTerm} onChange={(e) => this.setState({ topicSearchTerm: e.target.value }, this.refreshCurrentSelectionsAndFilters)} />
                        </div>
                        <Table 
                            data={filteredTopics} 
                            headers={[{ key: 'name' }]} 
                            options={{ reorderable: true, editable: true, deleteable: true, linkable: true }} 
                            listId="planning-topics" 
                            selectedItemId={selectedTopic} 
                            show={(item) => this.handleTopicSelect(item.id)} 
                            edit={(topic) => this.setState({ topicToEdit: topic }, () => this.editTopicModalRef.current.show())} 
                            delete={(topic) => this.setState({ topicToDelete: topic }, () => this.deleteTopicModalRef.current.show())} 
                            onOrderChange={(list) => this._handleReorder('topics', list)}
                        />
                    </div>
                </div>

                {/* Sub-strands Column */}
                {selectedTopic && (
                    <div className="cm-sub-column" style={{ width: '320px' }}>
                        <div className="cm-column-header">
                            <h5 className="flex-grow-1"><i className="la la-stream mr-2"></i>Sub-strands</h5>
                            <button className="cm-add-btn" onClick={() => this.addSubtopicModalRef.current.show()} title="Add Sub-strand"><i className="la la-plus"></i></button>
                        </div>
                        <div className="cm-column-body">
                            <div className="cm-search-wrapper">
                                <i className="la la-search search-icon"></i>
                                <input type="text" className="form-control cm-search-input" placeholder="Search sub-strands..." value={subtopicSearchTerm} onChange={(e) => this.setState({ subtopicSearchTerm: e.target.value }, this.refreshCurrentSelectionsAndFilters)} />
                            </div>
                            <Table 
                                data={filteredSubtopics} 
                                headers={[{ key: 'name' }]} 
                                options={{ reorderable: true, editable: true, deleteable: true, linkable: true }} 
                                listId="planning-subtopics" 
                                selectedItemId={selectedSubtopic} 
                                show={(item) => this.handleSubtopicSelect(item.id)} 
                                edit={(subtopic) => this.setState({ subtopicToEdit: subtopic }, () => this.editSubtopicModalRef.current.show())} 
                                delete={(subtopic) => this.setState({ subtopicToDelete: subtopic }, () => this.deleteSubtopicModalRef.current.show())} 
                                onOrderChange={(list) => this._handleReorder('subtopics', list)}
                            />
                        </div>
                    </div>
                )}

                {/* Planning Details (Table) Column */}
                {selectedSubtopic ? (
                    <div className="cm-column cm-column-large p-0" style={{ flexGrow: 1, height: '100%', border: 'none', borderRadius: 0, background: 'transparent' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            {/* Sub-strand title banner */}
                            <div style={{ padding: '12px 20px', background: '#fff', borderLeft: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
                                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', fontWeight: 700, marginBottom: '2px' }}>
                                    <i className="la la-layer-group mr-1"></i>{this.getTopicName(selectedTopic)}
                                </div>
                                <h5 style={{ margin: 0, fontWeight: 800, color: '#1e293b', fontSize: '1.05rem' }}>
                                    <i className="la la-stream mr-2" style={{ color: 'var(--cm-primary-color)' }}></i>
                                    {this.getSubtopicName(selectedSubtopic)}
                                </h5>
                            </div>
                            <div className="planning-header" style={{ borderTop: 'none', borderLeft: '1px solid #f1f5f9' }}>
                                <div className="planning-sub-tabs">
                                    <div className={`planning-sub-tab ${planningSubTab === 'scheme' ? 'active' : ''}`} onClick={() => this.handlePlanningSubTabChange('scheme')}>Schemes of Work</div>
                                    <div className={`planning-sub-tab ${planningSubTab === 'lesson' ? 'active' : ''}`} onClick={() => this.handlePlanningSubTabChange('lesson')}>Lesson Plans</div>
                                    <div className={`planning-sub-tab ${planningSubTab === 'record' ? 'active' : ''}`} onClick={() => this.handlePlanningSubTabChange('record')}>Daily Records of Work</div>
                                    <div className={`planning-sub-tab ${planningSubTab === 'iep' ? 'active' : ''}`} onClick={() => this.handlePlanningSubTabChange('iep')}>IEP Template</div>
                                </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button className="btn btn-primary btn-sm" onClick={() => this.setState({ 
                                            showPlanningModal: true, 
                                            schemeToEdit: null, 
                                            recordToEdit: null, 
                                            lessonPlanToEdit: null, 
                                            iepToEdit: null 
                                        })}>
                                            <i className="la la-plus"></i> Add {
                                                planningSubTab === 'scheme' ? 'Scheme Entry' : 
                                                planningSubTab === 'lesson' ? 'Lesson Plan' : 
                                                planningSubTab === 'record' ? 'Daily Record' : 'IEP'
                                            }
                                        </button>
                                        <button className="btn btn-outline-primary btn-sm" onClick={this.handlePrintPlanning}>
                                            <i className="la la-print"></i> Print
                                        </button>
                                    </div>
                            </div>

                            <div className="planning-content" style={{ backgroundColor: '#fcfdfe', borderLeft: '1px solid #f1f5f9' }}>
                                {planningSubTab === 'scheme' && this.renderSchemesTable()}
                                {planningSubTab === 'lesson' && this.renderLessonPlansTable()}
                                {planningSubTab === 'record' && this.renderRecordsTable()}
                                {planningSubTab === 'iep' && this.renderIepTemplatesTable()}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-grow-1 d-flex align-items-center justify-content-center text-muted p-5">
                        <div className="text-center">
                            <i className="la la-arrow-left mb-3" style={{ fontSize: '3rem', opacity: 0.1 }}></i>
                            <p>Select a {selectedTopic ? 'sub-strand' : 'strand'} to view and manage planning.</p>
                        </div>
                    </div>
                )}
                
                {this.renderPlanningModal()}
            </div>
        );
    }

    renderSchemesTable() {
        const { filteredSchemes } = this.state;
        return (
            <div className="planning-table-container">
                <table className="planning-table">
                    <thead>
                        <tr>
                            <th>Week/Lesson</th>
                            <th>Strands</th>
                            <th>Outcomes & Questions</th>
                            <th>Experience & Competencies</th>
                            <th>Resources & Methods</th>
                            <th>Reflection</th>
                            <th className="planning-actions">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSchemes.length > 0 ? filteredSchemes.map(item => (
                            <tr key={item.id}>
                                <td>
                                    <strong>Wk {item.week}</strong><br/>
                                    <span className="text-muted">Les {item.lessonnumber}</span>
                                </td>
                                <td>
                                    <div className="font-weight-bold">{item.strand}</div>
                                    <div className="small text-muted">{item.substrands}</div>
                                </td>
                                <td>
                                    <div className="rich-content-cell" dangerouslySetInnerHTML={{ __html: item.learningoutcomes }}></div>
                                    <div className="small mt-1 text-primary" dangerouslySetInnerHTML={{ __html: item.keyenquiringquestions }}></div>
                                </td>
                                <td>
                                    <div className="rich-content-cell" dangerouslySetInnerHTML={{ __html: item.learningexperience }}></div>
                                    <div className="small mt-1 font-italic" dangerouslySetInnerHTML={{ __html: item.corecompetencies }}></div>
                                </td>
                                <td>
                                    <div className="small" dangerouslySetInnerHTML={{ __html: item.learningresources }}></div>
                                    <div className="small mt-1 text-info" dangerouslySetInnerHTML={{ __html: item.assessment }}></div>
                                </td>
                                <td>
                                    <div className="rich-content-cell" dangerouslySetInnerHTML={{ __html: item.reflection }}></div>
                                </td>
                                <td>
                                    <div className="planning-actions">
                                        <button className="planning-btn" onClick={() => this.setState({ schemeToEdit: item, showPlanningModal: true })}><i className="la la-pencil"></i></button>
                                        <button className="planning-btn btn-danger" onClick={() => { if(window.confirm("Delete this scheme entry?")) Data.scheme_of_works.delete({ id: item.id }) }}><i className="la la-trash"></i></button>
                                    </div>
                                </td>
                            </tr>
                        )) : <tr><td colSpan="7" className="text-center p-5 text-muted">No schemes of work entries found.</td></tr>}
                    </tbody>
                </table>
            </div>
        );
    }

    renderRecordsTable() {
        const { filteredRecords } = this.state;
        return (
            <div className="planning-table-container">
                <table className="planning-table">
                    <thead>
                        <tr>
                            <th>Week / Date</th>
                            <th>Strand / Sub-strand</th>
                            <th>Outcomes</th>
                            <th>Content Covered</th>
                            <th>Activities</th>
                            <th>Assignments</th>
                            <th className="planning-actions">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRecords.length > 0 ? filteredRecords.map(item => (
                            <tr key={item.id}>
                                <td>
                                    <strong>Week {item.week}</strong><br/>
                                    <span className="small text-muted">{item.dateofteaching}</span>
                                </td>
                                <td>
                                    <div className="font-weight-bold" style={{ fontSize: '0.8rem' }}>{item.strand}</div>
                                    <div className="small text-muted">{item.substrands}</div>
                                </td>
                                <td><div className="rich-content-cell" dangerouslySetInnerHTML={{ __html: item.learningoutcomes }}></div></td>
                                <td><div className="rich-content-cell" dangerouslySetInnerHTML={{ __html: item.lessoncovered }}></div></td>
                                <td><div className="rich-content-cell" dangerouslySetInnerHTML={{ __html: item.keyactivities }}></div></td>
                                <td><div className="rich-content-cell" dangerouslySetInnerHTML={{ __html: item.assignments }}></div></td>
                                <td>
                                    <div className="planning-actions">
                                        <button className="planning-btn" onClick={() => this.setState({ recordToEdit: item, showPlanningModal: true })}><i className="la la-pencil"></i></button>
                                        <button className="planning-btn btn-danger" onClick={() => { if(window.confirm("Delete this record entry?")) Data.record_of_works.delete({ id: item.id }) }}><i className="la la-trash"></i></button>
                                    </div>
                                </td>
                            </tr>
                        )) : <tr><td colSpan="7" className="text-center p-5 text-muted">No records of work found.</td></tr>}
                    </tbody>
                </table>
            </div>
        );
    }

    renderLessonPlansTable() {
        const { filteredLessonPlans } = this.state;
        return (
            <div className="planning-table-container">
                <table className="planning-table">
                    <thead>
                        <tr>
                            <th>Strands</th>
                            <th>Learning Outcomes</th>
                            <th>Key Enquiry Questions</th>
                            <th>Resources</th>
                            <th>Introduction & Dev</th>
                            <th>Conclusion & Ext</th>
                            <th>Reflection</th>
                            <th className="planning-actions">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLessonPlans.length > 0 ? filteredLessonPlans.map(item => (
                            <tr key={item.id}>
                                <td>
                                    <div className="font-weight-bold">{item.strand}</div>
                                    <div className="small text-muted">{item.substrands}</div>
                                </td>
                                <td><div className="rich-content-cell" dangerouslySetInnerHTML={{ __html: item.learningoutcomes }}></div></td>
                                <td><div className="small text-primary" dangerouslySetInnerHTML={{ __html: item.keyenquiringquestions }}></div></td>
                                <td><div className="small" dangerouslySetInnerHTML={{ __html: item.learningresources }}></div></td>
                                <td>
                                    <div className="small font-weight-bold">Intro:</div>
                                    <div className="rich-content-cell mb-2" dangerouslySetInnerHTML={{ __html: item.introduction }}></div>
                                    <div className="small font-weight-bold">Dev:</div>
                                    <div className="rich-content-cell" dangerouslySetInnerHTML={{ __html: item.lessondevelopment }}></div>
                                </td>
                                <td>
                                    <div className="small font-weight-bold">Conclusion:</div>
                                    <div className="rich-content-cell mb-2" dangerouslySetInnerHTML={{ __html: item.conclusion }}></div>
                                    <div className="small font-weight-bold">Extended:</div>
                                    <div className="rich-content-cell" dangerouslySetInnerHTML={{ __html: item.extendedactivity }}></div>
                                </td>
                                <td><div className="rich-content-cell" dangerouslySetInnerHTML={{ __html: item.reflection }}></div></td>
                                <td>
                                    <div className="planning-actions">
                                        <button className="planning-btn" onClick={() => this.setState({ lessonPlanToEdit: item, showPlanningModal: true })}><i className="la la-pencil"></i></button>
                                        <button className="planning-btn btn-danger" onClick={() => { if(window.confirm("Delete this lesson plan?")) Data.lesson_plans.delete({ id: item.id }) }}><i className="la la-trash"></i></button>
                                    </div>
                                </td>
                            </tr>
                        )) : <tr><td colSpan="8" className="text-center p-5 text-muted">No lesson plans found.</td></tr>}
                    </tbody>
                </table>
            </div>
        );
    }

    renderIepTemplatesTable() {
        const { filteredIepTemplates } = this.state;
        const students = Data.students.list() || [];
        return (
            <div className="planning-table-container">
                <table className="planning-table">
                    <thead>
                        <tr>
                            <th>Learner</th>
                            <th>Strands</th>
                            <th>Strengths & Needs</th>
                            <th>Outcome & Exp</th>
                            <th>Resources & Methods</th>
                            <th>Dates</th>
                            <th>Reflection</th>
                            <th className="planning-actions">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredIepTemplates.length > 0 ? filteredIepTemplates.map(item => {
                            const student = students.find(s => String(s.id) === String(item.student?.id || item.student));
                            return (
                                <tr key={item.id}>
                                    <td>
                                        <div className="font-weight-bold">{student?.names || 'Unknown Learner'}</div>
                                        <div className="small text-muted">{student?.registration}</div>
                                    </td>
                                    <td>
                                        <div className="font-weight-bold">{item.strand}</div>
                                        <div className="small text-muted">{item.substrands}</div>
                                    </td>
                                    <td>
                                        <div className="small font-weight-bold text-success">Strengths:</div>
                                        <div className="rich-content-cell mb-2" dangerouslySetInnerHTML={{ __html: item.strengths }}></div>
                                        <div className="small font-weight-bold text-danger">Needs:</div>
                                        <div className="rich-content-cell" dangerouslySetInnerHTML={{ __html: item.needs }}></div>
                                    </td>
                                    <td>
                                        <div className="small font-weight-bold">Outcome:</div>
                                        <div className="rich-content-cell mb-2" dangerouslySetInnerHTML={{ __html: item.outcome }}></div>
                                        <div className="small font-weight-bold">Experience:</div>
                                        <div className="rich-content-cell" dangerouslySetInnerHTML={{ __html: item.experience }}></div>
                                    </td>
                                    <td>
                                        <div className="small font-weight-bold">Resources:</div>
                                        <div className="rich-content-cell mb-2" dangerouslySetInnerHTML={{ __html: item.resources }}></div>
                                        <div className="small font-weight-bold">Methods:</div>
                                        <div className="rich-content-cell" dangerouslySetInnerHTML={{ __html: item.methods }}></div>
                                    </td>
                                    <td>
                                        <div className="small"><strong>Start:</strong> {item.initiationDate || '-'}</div>
                                        <div className="small"><strong>End:</strong> {item.terminationDate || '-'}</div>
                                    </td>
                                    <td><div className="rich-content-cell" dangerouslySetInnerHTML={{ __html: item.reflection }}></div></td>
                                    <td>
                                        <div className="planning-actions">
                                            <button className="planning-btn" onClick={() => this.setState({ iepToEdit: item, showPlanningModal: true })}><i className="la la-pencil"></i></button>
                                            <button className="planning-btn btn-danger" onClick={() => { if(window.confirm("Delete this IEP entry?")) Data.iep_templates.delete({ id: item.id }) }}><i className="la la-trash"></i></button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        }) : <tr><td colSpan="8" className="text-center p-5 text-muted">No IEP templates found.</td></tr>}
                    </tbody>
                </table>
            </div>
        );
    }

    renderPlanningModal() {
        const { showPlanningModal, planningSubTab, schemeToEdit, recordToEdit, lessonPlanToEdit, iepToEdit } = this.state;
        if (!showPlanningModal) return null;

        const typeLabels = {
            scheme: 'Scheme of Work',
            lesson: 'Lesson Plan',
            record: 'Record of Work',
            iep: 'IEP Template'
        };

        const item = 
            planningSubTab === 'scheme' ? schemeToEdit : 
            planningSubTab === 'lesson' ? lessonPlanToEdit : 
            planningSubTab === 'record' ? recordToEdit : iepToEdit;

        const title = (item ? 'Edit ' : 'Add ') + typeLabels[planningSubTab];
        const students = Data.students.list() || [];

        const onSave = (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            
            // Add required context
            data.subject = this.state.selectedSubject;
            data.term = this.state.selectedTermId;
            data.school = this.state.school.id;
            
            // Always save the correct IDs for strand and substrands
            // All planning items need both topic (strand) and subtopic (substrands) IDs
            data.strand = this.state.selectedTopic;      // Topic ID
            data.substrands = this.state.selectedSubtopic; // Subtopic ID 
            
            // Fix: Parse integer fields for GraphQL compatibility
            if (data.week) data.week = parseInt(data.week);
            if (data.lessonnumber) data.lessonnumber = parseInt(data.lessonnumber);
            
            if (item) data.id = item.id;

            const apiMap = {
                scheme: Data.scheme_of_works,
                lesson: Data.lesson_plans,
                record: Data.record_of_works,
                iep: Data.iep_templates
            };

            apiMap[planningSubTab][item ? 'update' : 'create'](data)
                .then(() => {
                    toastr.success(`${typeLabels[planningSubTab]} saved successfully`);
                    this.setState({ showPlanningModal: false });
                })
                .catch(err => toastr.error(`Failed to save: ${err.message}`));
        };

        return (
            <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)', overflowY: 'auto' }}>
                <div className="modal-dialog modal-xl">
                    <div className="modal-content" style={{ borderRadius: '16px', border: 'none' }}>
                        <div className="modal-header d-flex flex-column align-items-start py-3">
                            <div className="d-flex justify-content-between w-100 mb-2">
                                <h5 className="modal-title">{title}</h5>
                                <button type="button" className="close" onClick={() => this.setState({ showPlanningModal: false })}>
                                    <span>&times;</span>
                                </button>
                            </div>
                            <div className="d-flex gap-3 small text-muted">
                                <span><i className="la la-layer-group"></i> <strong>Strand:</strong> {this.getTopicName(this.state.selectedTopic)}</span>
                                <span className="ml-3"><i className="la la-stream"></i> <strong>Sub-strand:</strong> {this.getSubtopicName(this.state.selectedSubtopic)}</span>
                            </div>
                        </div>
                        <form onSubmit={onSave}>
                            <div className="modal-body p-4">
                                {planningSubTab === 'iep' && (
                                    <div className="row mb-3">
                                        <div className="col-md-12">
                                            <div className="form-group">
                                                <label className="font-weight-bold">Name of Learner</label>
                                                <select name="student" className="form-control" defaultValue={item?.student?.id || item?.student} required>
                                                    <option value="">Select Learner...</option>
                                                    {students.map(s => <option key={s.id} value={s.id}>{s.names} ({s.registration})</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="row">
                                    {planningSubTab !== 'iep' && planningSubTab !== 'lesson' && (
                                        <div className="col-md-4">
                                            <div className="form-group">
                                                <label>Week</label>
                                                <input type="number" name="week" className="form-control" defaultValue={item?.week} required />
                                            </div>
                                        </div>
                                    )}
                                    {planningSubTab === 'scheme' && (
                                        <div className="col-md-8">
                                            <div className="form-group">
                                                <label>Lesson Number</label>
                                                <input type="number" name="lessonnumber" className="form-control" defaultValue={item?.lessonnumber} />
                                            </div>
                                        </div>
                                    )}
                                    {planningSubTab === 'record' && (
                                        <div className="col-md-8">
                                            <div className="form-group">
                                                <label>Date of Teaching</label>
                                                <input type="date" name="dateofteaching" className="form-control" defaultValue={item?.dateofteaching} />
                                            </div>
                                        </div>
                                    )}
                                    {planningSubTab === 'iep' && (
                                        <>
                                            <div className="col-md-6">
                                                <div className="form-group">
                                                    <label>Date of Initiation</label>
                                                    <input type="date" name="initiationDate" className="form-control" defaultValue={item?.initiationDate} />
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="form-group">
                                                    <label>Date of Termination</label>
                                                    <input type="date" name="terminationDate" className="form-control" defaultValue={item?.terminationDate} />
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="row mt-3">
                                    {planningSubTab === 'scheme' && (
                                        <>
                                            <PlanningField label="Learning Outcomes" name="learningoutcomes" value={item?.learningoutcomes} />
                                            <PlanningField label="Key Enquiring Questions" name="keyenquiringquestions" value={item?.keyenquiringquestions} />
                                            <PlanningField label="Learning Experience / Activities" name="learningexperience" value={item?.learningexperience} />
                                            <PlanningField label="Core Competencies" name="corecompetencies" value={item?.corecompetencies} />
                                            <PlanningField label="Learning Resources" name="learningresources" value={item?.learningresources} />
                                            <PlanningField label="Methods" name="assessment" value={item?.assessment} />
                                            <PlanningField label="Reflection" name="reflection" value={item?.reflection} />
                                        </>
                                    )}
                                    {planningSubTab === 'lesson' && (
                                        <>
                                            <PlanningField label="Lesson Learning Outcomes" name="learningoutcomes" value={item?.learningoutcomes} />
                                            <PlanningField label="Key Enquiry Questions" name="keyenquiringquestions" value={item?.keyenquiringquestions} />
                                            <PlanningField label="Learning Resources" name="learningresources" value={item?.learningresources} />
                                            <PlanningField label="Introduction" name="introduction" value={item?.introduction} />
                                            <PlanningField label="Lesson Development" name="lessondevelopment" value={item?.lessondevelopment} />
                                            <PlanningField label="Conclusion" name="conclusion" value={item?.conclusion} />
                                            <PlanningField label="Extended Activity" name="extendedactivity" value={item?.extendedactivity} />
                                            <PlanningField label="Reflection" name="reflection" value={item?.reflection} />
                                        </>
                                    )}
                                    {planningSubTab === 'record' && (
                                        <>
                                            <PlanningField label="Learning Outcomes" name="learningoutcomes" value={item?.learningoutcomes} />
                                            <PlanningField label="Lesson Covered / Content" name="lessoncovered" value={item?.lessoncovered} />
                                            <PlanningField label="Key Activities" name="keyactivities" value={item?.keyactivities} />
                                            <PlanningField label="Assignments" name="assignments" value={item?.assignments} />
                                        </>
                                    )}
                                    {planningSubTab === 'iep' && (
                                        <>
                                            <PlanningField label="Areas of Strength" name="strengths" value={item?.strengths} />
                                            <PlanningField label="Area of Need" name="needs" value={item?.needs} />
                                            <PlanningField label="Specific Learning Outcome" name="outcome" value={item?.outcome} />
                                            <PlanningField label="Learning Experience" name="experience" value={item?.experience} />
                                            <PlanningField label="Resources Required" name="resources" value={item?.resources} />
                                            <PlanningField label="Assessment Method and Tools" name="methods" value={item?.methods} />
                                            <PlanningField label="Reflection" name="reflection" value={item?.reflection} />
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => this.setState({ showPlanningModal: false })}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Entry</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    }
}

// Helper for rich text fields in the modal
const PlanningField = ({ label, name, value }) => {
    // We'll use a hidden input for the form submit to catch the Quill value
    // In a real production app, we'd use controlled components, but for this fast refactor
    // we'll use a local state or a ref.
    const [content, setContent] = React.useState(value || '');
    return (
        <div className="col-md-6 mb-3">
            <label className="font-weight-bold">{label}</label>
            <input type="hidden" name={name} value={content} />
            <ReactQuill theme="snow" value={content} onChange={setContent} style={{ height: '150px', marginBottom: '45px' }} />
        </div>
    );
};

export default CurriculumManagerV5;