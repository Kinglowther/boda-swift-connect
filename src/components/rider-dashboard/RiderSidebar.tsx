import React from 'react';
import { User } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Bike, MapPin, Settings, LogOut, Star, DollarSign, Package } from 'lucide-react';

interface RiderSidebarProps {
  user: User | null;
  riderStats: { totalEarnings: number; completedRides: number; rating: number; shujaaPoints: number };
  isOnline: boolean;
  setIsOnline: (isOnline: boolean) => void;
  activeTab: string;
  handleTabChange: (tab: string) => void;
  handleLogout: () => void;
}

const RiderSidebar: React.FC<RiderSidebarProps> = ({ user, riderStats, isOnline, setIsOnline, activeTab, handleTabChange, handleLogout }) => {
  return (
    <>
      {/* User Profile Section */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3 mb-4">
          <Avatar className="w-12 h-12">
            <AvatarImage src={user?.profileImage} alt={user?.name} />
            <AvatarFallback className="bg-boda-600 text-white">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'R'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-foreground">{user?.name}</h3>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <div className="flex items-center space-x-1 mt-1">
              <Star className="h-3 w-3 text-yellow-500" />
              <span className="text-xs text-muted-foreground">{riderStats.rating}/5.0</span>
            </div>
          </div>
        </div>

        {/* Online Status Toggle */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg mb-4">
          <div>
            <span className="font-medium text-foreground">Online Status</span>
            <p className="text-xs text-muted-foreground">
              {isOnline ? 'Available for orders' : 'Offline'}
            </p>
          </div>
          <Switch
            checked={isOnline}
            onCheckedChange={setIsOnline}
          />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs text-green-700 dark:text-green-300">Earnings</p>
                <p className="font-semibold text-green-800 dark:text-green-200">
                  Ksh. {riderStats.totalEarnings.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-xs text-blue-700 dark:text-blue-300">Completed</p>
                <p className="font-semibold text-blue-800 dark:text-blue-200">
                  {riderStats.completedRides}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4">
        <nav className="space-y-2">
          <button
            onClick={() => handleTabChange('available-orders')}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
              activeTab === 'available-orders' 
                ? 'bg-boda-100 dark:bg-boda-800/50 text-boda-800 dark:text-boda-200 font-medium' 
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <MapPin className="inline-block h-4 w-4 mr-2" />
            Available Orders
          </button>
          
          <button
            onClick={() => handleTabChange('my-orders')}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
              activeTab === 'my-orders' 
                ? 'bg-boda-100 dark:bg-boda-800/50 text-boda-800 dark:text-boda-200 font-medium' 
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <Bike className="inline-block h-4 w-4 mr-2" />
            My Orders
          </button>
          
          <button
            onClick={() => handleTabChange('settings')}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
              activeTab === 'settings' 
                ? 'bg-boda-100 dark:bg-boda-800/50 text-boda-800 dark:text-boda-200 font-medium' 
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <Settings className="inline-block h-4 w-4 mr-2" />
            Settings
          </button>
        </nav>
      </div>

      {/* Logout Button */}
      <div className="p-4 border-t border-border">
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full justify-start text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </>
  );
};

export default RiderSidebar;
