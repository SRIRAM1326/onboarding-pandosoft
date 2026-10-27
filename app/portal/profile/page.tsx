import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { currentMockUser } from "@/lib/mock-data/users";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Your account information</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Name</span>
            <span>{currentMockUser.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span>{currentMockUser.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Phone</span>
            <span>{currentMockUser.phone}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Organization</span>
            <span>{currentMockUser.organization}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Role</span>
            <span>Customer</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
