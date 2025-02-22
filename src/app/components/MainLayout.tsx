import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { LeftMenu } from './LeftMenu';
import { FrontMenu } from './FrontMenu';

interface MainLayoutProps {
    children: React.ReactNode;
    leftLinkText: string;
    leftLinkHref: string;
}

export const MainLayout = ({ children, leftLinkText, leftLinkHref }: MainLayoutProps) => {
    return (<>
            <ToastContainer />
            <main className="flex flex-col min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
                <div className="flex">
                    <div className="w-1/6">
                        <LeftMenu />
                    </div>
                    <div className="flex-1">
                        <div className="h-[10vh] flex items-center justify-between px-4 border-b border-gray-700/50">
                            <FrontMenu leftLinkText={leftLinkText} leftLinkHref={leftLinkHref} />
                        </div>
                        {children}
                    </div>
                </div>
            </main>
            </>
    );
};