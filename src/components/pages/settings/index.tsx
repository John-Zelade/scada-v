import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


type SettingsProps = {
  onLogout: () => void;
};

export function Settings({ onLogout }: SettingsProps) {
  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md mt-8">
      <h2 className="text-2xl font-semibold mb-4">Settings</h2>

      {/* Example setting item */}
      <div className="mb-6 flex justify-between items-center">
        <Label
          className="block text-gray-700 mb-1"
          htmlFor="push-notifications"
        >
          Push Notifications
        </Label>
        <Input type="checkbox" id="Push-notifications" className="h-5 w-5" />
      </div>

      {/* Logout button */}
      <button
        onClick={onLogout}
        className="w-full py-2 px-4 bg-red-600 text-white rounded hover:bg-red-700 transition"
      >
        Logout
      </button>
    </div>
  );
}
