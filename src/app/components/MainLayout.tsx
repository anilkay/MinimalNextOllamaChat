import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import   LeftMenu  from './LeftMenu';
import  FrontMenu from './FrontMenu';

interface MainLayoutProps {
    children: React.ReactNode;
    leftLinkText: string;
    leftLinkHref: string;
}

export const MainLayout = ({ children, leftLinkText, leftLinkHref }: MainLayoutProps) => {
    return (<>
            <ToastContainer theme="dark" />
            <main className="flex h-screen bg-gray-900 text-gray-100 overflow-hidden">
                {/* Sidebar */}
                <aside className="w-64 flex-shrink-0 bg-gray-950 border-r border-gray-800 flex flex-col">
                    <div className="p-4 border-b border-gray-800">
                        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                            Ollama Chat
                        </h1>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                        <LeftMenu />
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Header */}
                    <header className="h-14 flex items-center justify-between px-6 border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm z-10">
                        <FrontMenu leftLinkText={leftLinkText} leftLinkHref={leftLinkHref} />
                    </header>
                    
                    {/* Content Area */}
                    <div className="flex-1 relative overflow-hidden">
                        {children}
                    </div>
                </div>
            </main>
            </>
    );
};