import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Button } from '../../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { useAuth } from '../../hooks/useAuth';

const Navbar = () => {
  const { user, logout } = useAuth();

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.split(' ').filter(Boolean);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase();
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="w-full px-6 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-xl font-bold text-gray-900">Central SI</span>
        </div>

        <div className="flex items-center space-x-3">
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-2 py-1 hover:bg-gray-50 focus:outline-none transition-colors">
                  <Avatar>
                    <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block text-sm text-gray-700 max-w-[220px] truncate">
                    {user.fullName}
                  </span>
                </button>
              </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">{user.fullName}</span>
                      <span className="text-xs text-gray-500">{user.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onClick={logout}>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
          )}
          {!user && (
            <Button variant="outline" size="sm">Login</Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;


