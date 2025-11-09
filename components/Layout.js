import Header from './Header';
import BottomTabs from './BottomTabs';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Desktop Header */}
      <div className="hidden md:block">
        <Header />
      </div>

      {/* Page Content */}
      <main className="flex-grow pb-16">{children}</main>

      {/* Mobile Bottom Navigation */}
      <div className="block md:hidden fixed bottom-0 left-0 w-full z-50">
        <BottomTabs />
      </div>
    </div>
  );
}
