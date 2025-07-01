import React from 'react'

import DesignPanel from './components/panels/DesignPanel'
import ExportPanel from './components/panels/ExportPanel'
import TextEditor from './components/panels/TextEditor'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/Tabs'
import { CanvasModel } from './components/canvas/Canvas'

const App: React.FC = () => {
  return (
    <div className="flex flex-col h-screen md:flex-row bg-gray-50">
      {/* Canvas Area */}
      <div className="w-full h-[60vh] md:h-full md:w-3/4 relative">
        <CanvasModel  />
      </div>

      {/* Control Panel */}
      <div className="w-full md:w-1/4 border-t md:border-t-0 md:border-l overflow-y-auto bg-white p-4">
        <Tabs defaultValue="design" className="w-full">
          <TabsList className="grid grid-cols-3 w-full mb-4">
            <TabsTrigger value="design">Design</TabsTrigger>
            <TabsTrigger value="text">Text</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>
          
          <TabsContent value="design">
            <DesignPanel />
          </TabsContent>
          <TabsContent value="text">
            <TextEditor />
          </TabsContent>
          <TabsContent value="export">
            <ExportPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default App