import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Handlebars from 'handlebars';
import MessageView from './components/message';
import Data from '../../utils/data';

// --- HANDLEBARS HELPERS ---
Handlebars.registerHelper("fallback", (value, fallback) => {
    return value ? new Handlebars.SafeString(value) : fallback;
});

export default function MessageComposer() {
  // --- STATE ---
  // Core Data
  const [classes, setClasses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [teachers, setTeachers] = useState([]);
  
  // Recipient List State
  const [displayList, setDisplayList] = useState([]); // The parents/staff currently shown
  const [totalCount, setTotalCount] = useState(0);    // Total available on server
  const [isLoadingList, setIsLoadingList] = useState(false);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const ROWS_PER_PAGE = 50; // Load 50 at a time for better performance
  const [hasMore, setHasMore] = useState(false);

  // Filters & Inputs
  const [activeTab, setActiveTab] = useState('parents'); 
  const [subFilterId, setSubFilterId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  
  // Message State
  const [messageTemplate, setMessageTemplate] = useState("Hello {{recipient.name}},\n\nThis is a message regarding {{fallback student.names 'your child'}}.");
  const [messageType, setMessageType] = useState('sms');
  const [isSending, setIsSending] = useState(false);

  // --- 1. INITIAL SETUP ---
  useEffect(() => {
    const init = async () => {
      // We only load the structural data initially, NOT all parents
      const [cls, rts, tchs] = await Promise.all([
        Data.classes.list(),
        Data.routes.list(),
        Data.teachers.list()
      ]);
      setClasses(cls);
      setRoutes(rts);
      setTeachers(tchs);
    };
    init();
  }, []);

  // --- 1. INITIAL SETUP (FIXED WITH SUBSCRIPTIONS) ---
  useEffect(() => {
    // We subscribe instead of just listing. 
    // This fixes the issue where data isn't ready when the component loads.
    
    const unsubClasses = Data.classes.subscribe(({ classes }) => {
        if(classes) setClasses(classes);
    });

    const unsubRoutes = Data.routes.subscribe(({ routes }) => {
        if(routes) setRoutes(routes);
    });

    const unsubTeachers = Data.teachers.subscribe(({ teachers }) => {
        if(teachers) setTeachers(teachers);
    });

    // Cleanup subscriptions when component unmounts
    return () => {
        if(unsubClasses) unsubClasses();
        if(unsubRoutes) unsubRoutes();
        if(unsubTeachers) unsubTeachers();
    };
  }, []);

  // --- 2. DATA FETCHING LOGIC ---
  const fetchRecipients = useCallback(async (isLoadMore = false) => {
    setIsLoadingList(true);
    let newList = [];
    let newTotal = 0;

    try {
      if (activeTab === 'parents') {
        // --- SCENARIO A: ALL PARENTS (PAGINATED) ---
        // Use the getPage method from Data.js
        const result = await Data.parents.getPage({ 
            page: isLoadMore ? page + 1 : 1, 
            limit: ROWS_PER_PAGE 
        });
        
        newList = result.parents;
        newTotal = result.totalCount;

        if (isLoadMore) {
          setDisplayList(prev => [...prev, ...newList]);
          setPage(prev => prev + 1);
        } else {
          setDisplayList(newList);
          setPage(1);
        }
        
        // Calculate if we have more pages
        const currentCount = isLoadMore ? displayList.length + newList.length : newList.length;
        setHasMore(currentCount < newTotal);
        setTotalCount(newTotal);

      } else if (activeTab === 'classes' && subFilterId) {
        // --- SCENARIO B: BY CLASS (FETCH VIA CLASS ENTITY) ---
        // Use Data.classes to get the specific class and its students->parents
        // Note: We assume class sizes are reasonable (<100), so we fetch all at once.
        const targetClass = classes.find(c => c.id === subFilterId);
        if (targetClass && targetClass.students) {
           // Extract unique parents from the students
           const uniqueParents = new Map();
           targetClass.students.forEach(student => {
              if (student.parent) {
                if (uniqueParents.has(student.parent.id)) {
                  uniqueParents.get(student.parent.id).students.push(student);
                } else {
                  uniqueParents.set(student.parent.id, { ...student.parent, students: [student] });
                }
              }
           });
           newList = Array.from(uniqueParents.values());
        }
        setDisplayList(newList);
        setHasMore(false); // No pagination for sub-filters yet
        setTotalCount(newList.length);

      } else if (activeTab === 'routes' && subFilterId) {
        // --- SCENARIO C: BY ROUTE ---
        // We use the helper we added to Data.js or filter locally if data isn't nested deeply
        // For robustness, we can use the getForRoute helper if implemented, 
        // or query the route. For now, let's assume we filter the `Data.parents.getForRoute` 
        // *BUT* that helper required allData.parents. 
        // *BETTER:* Fetch the Route and its students.
        const route = await Data.routes.getOne(subFilterId); // Assuming getOne exists or find in list
        // Since routes list is loaded, find it there
        const targetRoute = routes.find(r => r.id === subFilterId);
        
        if (targetRoute && targetRoute.students) {
            const uniqueParents = new Map();
            targetRoute.students.forEach(student => {
                 // The student object inside route might not have parent nested depending on Query depth.
                 // If data is missing, we might need a specific query. 
                 // Assuming standard fragment depth:
                 if (student.parent) {
                   if (uniqueParents.has(student.parent.id)) {
                     uniqueParents.get(student.parent.id).students.push(student);
                   } else {
                     uniqueParents.set(student.parent.id, { ...student.parent, students: [student] });
                   }
                 }
            });
            newList = Array.from(uniqueParents.values());
        }
        setDisplayList(newList);
        setHasMore(false);
        setTotalCount(newList.length);

      } else if (activeTab === 'staff') {
        // --- SCENARIO D: STAFF ---
        setDisplayList(teachers);
        setHasMore(false);
        setTotalCount(teachers.length);
      } else {
        // Reset
        setDisplayList([]);
        setHasMore(false);
      }
    } catch (e) {
      console.error("Error fetching recipients", e);
    } finally {
      setIsLoadingList(false);
    }
  }, [activeTab, subFilterId, page, classes, routes, teachers, displayList.length]);

  // Trigger fetch when tabs/filters change (Not on pagination state change)
    useEffect(() => {
    // Reset selections and list when tab/filter changes
    setSelectedIds(new Set());
    setPage(1);
    fetchRecipients(false); 
  }, [activeTab, subFilterId, classes, routes]); 


  // --- 3. FILTERING (Client-side Search on Loaded Data) ---
  // Since the backend `getPage` doesn't support search string yet, 
  // we filter what we have loaded.
  const filteredList = useMemo(() => {
    if (!searchTerm) return displayList;
    return displayList.filter(item => {
      const name = item.name || item.names || '';
      return name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (item.phone && item.phone.includes(searchTerm));
    });
  }, [displayList, searchTerm]);


  // --- 4. HANDLERS ---

  const handleLoadMore = () => {
    fetchRecipients(true);
  };

  const handleSelectAll = (isChecked) => {
    if (isChecked) {
      // Select currently loaded
      const newIds = new Set(filteredList.map(item => item.id));
      setSelectedIds(newIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (itemId, isChecked) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      isChecked ? newSet.add(itemId) : newSet.delete(itemId);
      return newSet;
    });
  };

  const handleSend = async () => {
    if (selectedIds.size === 0) {
      alert("Please select at least one recipient.");
      return;
    }
    setIsSending(true);

    try {
      const payload = {
        school: localStorage.getItem("school"),
        message: messageTemplate,
        parents: Array.from(selectedIds)
      };

      await Data.communication.sms.create(payload);

      alert(`Messages queued successfully for ${selectedIds.size} recipient(s).`);
      setIsSending(false);
      setSelectedIds(new Set()); 
    } catch (error) {
      console.error("Failed to send SMS:", error);
      alert("Failed to send messages.");
      setIsSending(false);
    }
  };

  const previewRecipient = useMemo(() => {
    if (selectedIds.size === 0) return null;
    const firstId = selectedIds.values().next().value;
    return displayList.find(p => p.id === firstId);
  }, [selectedIds, displayList]);

  return (
    <MessageView
      activeTab={activeTab}
      onTabChange={tab => { setActiveTab(tab); setSubFilterId(''); setSearchTerm(''); }}
      subFilterId={subFilterId}
      onSubFilterIdChange={e => setSubFilterId(e.target.value)}
      searchTerm={searchTerm}
      onSearchChange={e => setSearchTerm(e.target.value)}
      classes={classes}
      routes={routes}
      
      // List Props
      displayList={filteredList}
      totalCount={totalCount}
      isLoading={isLoadingList}
      hasMore={hasMore}
      onLoadMore={handleLoadMore}
      
      // Selection
      selectedIds={selectedIds}
      onSelectAll={handleSelectAll}
      onSelectOne={handleSelectOne}
      
      // Message Props
      messageTemplate={messageTemplate}
      onMessageChange={e => setMessageTemplate(e.target.value)}
      messageType={messageType}
      onMessageTypeChange={setMessageType}
      onSend={handleSend}
      isSending={isSending}
      previewRecipient={previewRecipient}
    />
  );
}