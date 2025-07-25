import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Clients from "./Clients";

import ClientRoom from "./ClientRoom";

import NewClient from "./NewClient";

import ClientPortal from "./ClientPortal";

import Processes from "./Processes";

import Settings from "./Settings";

import Tasks from "./Tasks";

import Meetings from "./Meetings";

import Landing from "./Landing";

import Leads from "./Leads";

import TeamManagement from "./TeamManagement";

import ScheduledActions from "./ScheduledActions";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Clients: Clients,
    
    ClientRoom: ClientRoom,
    
    NewClient: NewClient,
    
    ClientPortal: ClientPortal,
    
    Processes: Processes,
    
    Settings: Settings,
    
    Tasks: Tasks,
    
    Meetings: Meetings,
    
    Landing: Landing,
    
    Leads: Leads,
    
    TeamManagement: TeamManagement,
    
    ScheduledActions: ScheduledActions,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Clients" element={<Clients />} />
                
                <Route path="/ClientRoom" element={<ClientRoom />} />
                
                <Route path="/NewClient" element={<NewClient />} />
                
                <Route path="/ClientPortal" element={<ClientPortal />} />
                
                <Route path="/Processes" element={<Processes />} />
                
                <Route path="/Settings" element={<Settings />} />
                
                <Route path="/Tasks" element={<Tasks />} />
                
                <Route path="/Meetings" element={<Meetings />} />
                
                <Route path="/Landing" element={<Landing />} />
                
                <Route path="/Leads" element={<Leads />} />
                
                <Route path="/TeamManagement" element={<TeamManagement />} />
                
                <Route path="/ScheduledActions" element={<ScheduledActions />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}