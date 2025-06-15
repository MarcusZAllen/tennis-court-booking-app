
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const ProfileAvatar = () => (
  <div className="flex items-center gap-2">
    <Avatar className="w-8 h-8 border-2 border-white shadow">
      <AvatarImage
        src="https://randomuser.me/api/portraits/men/32.jpg"
        alt="User"
        className="h-8 w-8 rounded-full"
      />
      <AvatarFallback>JD</AvatarFallback>
    </Avatar>
    <span className="text-black font-semibold text-base font-jost">John Doe</span>
  </div>
);

export default ProfileAvatar;
