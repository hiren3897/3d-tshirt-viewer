import React from 'react'

import DesignPanel from './components/panels/DesignPanel'
import { CanvasModel } from './components/canvas/Canvas'
import { DesignProvider } from './contexts/DesignStoreProvider'

const App: React.FC = () => {
  return (
    <DesignProvider>
    <div className="flex flex-col h-screen md:flex-row bg-gray-50">
      {/* Canvas Area */}
      <div className="w-full h-[60vh] md:h-full md:w-3/4 relative">
        <CanvasModel  />
      </div>

      {/* Control Panel */}
      <div className="w-full md:w-1/2 border-t md:border-t-0 md:border-l overflow-y-auto bg-white p-4">
        <DesignPanel />
      </div>
    </div>
    </DesignProvider>
  )
}

export default App