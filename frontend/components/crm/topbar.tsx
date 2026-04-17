import { Bell, Zap, Search, HelpCircle, Settings, MoonStar, SunMedium } from "lucide-react";

type TopbarProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  notificationCount: number;
  onNotificationClick: () => void;
  isDarkMode: boolean;
  onThemeToggle: () => void;
  displayName: string;
  displayEmail: string;
};

export function Topbar({
  searchValue,
  onSearchChange,
  notificationCount,
  onNotificationClick,
  isDarkMode,
  onThemeToggle,
  displayName,
  displayEmail,
}: TopbarProps) {
  const initials = displayName
    .split(" ")
    .map((value) => value[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="fixed top-0 left-0 w-full z-50 h-[64px] bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-xl flex justify-between items-center px-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Zap className="text-white w-5 h-5 fill-white" />
          </div>
          <span className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white">InvoAura</span>
        </div>
        
        <div className="hidden md:flex ml-8 items-center bg-surface-container-low rounded-full px-4 py-1.5 gap-2 w-96 border border-outline-variant/10">
          <Search className="text-outline w-4 h-4" />
          <input 
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-outline text-on-surface outline-none" 
            placeholder="Search across logistics intelligence..." 
            type="text" 
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button 
          onClick={onThemeToggle}
          className="p-2 text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 rounded-full transition-colors duration-200"
        >
          {isDarkMode ? <SunMedium className="w-5 h-5" /> : <MoonStar className="w-5 h-5" />}
        </button>      
        <button 
          onClick={onNotificationClick}
          className="relative p-2 text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 rounded-full transition-colors duration-200"
        >
          <Bell className="w-5 h-5" />
          {notificationCount > 0 && (
            <span className="absolute top-1 right-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-on-error">
              {notificationCount}
            </span>
          )}
        </button>
        <button className="p-2 text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 rounded-full transition-colors duration-200">
          <HelpCircle className="w-5 h-5" />
        </button>
        <button className="p-2 text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 rounded-full transition-colors duration-200">
          <Settings className="w-5 h-5" />
        </button>
        
        <div className="w-px h-6 bg-outline-variant/30 mx-2"></div>
        
        <div className="w-8 h-8 rounded-full border-2 border-white shadow-sm flex items-center justify-center bg-primary-container text-on-primary-container text-xs font-bold">
          {initials}
        </div>
      </div>
    </header>
  );
}
