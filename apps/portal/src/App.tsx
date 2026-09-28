import { Navigate, Route, Routes } from 'react-router-dom'
import { StoreProvider } from './data'
import { DocumentChecklistsPage } from './features/documents'
import { ApprovalsPage } from './features/exceptions'
import { MilestoneTemplatesPage, MyTasksPage } from './features/tasks'
import { AppShell } from './shell/AppShell'
import { JobsList } from './shell/JobsList'
import { NotFound } from './shell/NotFound'
import { Shipment360 } from './shell/Shipment360'

export default function App() {
  return (
    <StoreProvider>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/jobs" replace />} />
          <Route path="jobs" element={<JobsList />} />
          <Route path="jobs/:jobId" element={<Navigate to="tasks" replace />} />
          <Route path="jobs/:jobId/:tab" element={<Shipment360 />} />
          <Route path="my-tasks" element={<MyTasksPage />} />
          <Route path="approvals" element={<ApprovalsPage />} />
          <Route path="settings/milestone-templates" element={<MilestoneTemplatesPage />} />
          <Route path="settings/document-checklists" element={<DocumentChecklistsPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </StoreProvider>
  )
}
