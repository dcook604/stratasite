import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface SessionTimeoutWarningProps {
  isOpen: boolean;
  onStayLoggedIn: () => void;
  onLogout: () => void;
  countdown: number;
}

const SessionTimeoutWarning: React.FC<SessionTimeoutWarningProps> = ({
  isOpen,
  onStayLoggedIn,
  onLogout,
  countdown,
}) => {
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you still there?</AlertDialogTitle>
          <AlertDialogDescription>
            You've been inactive for a while. For your security, you will be logged out automatically in{' '}
            <span className="font-bold text-red-500">{countdown}</span> seconds.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onLogout}>
            Logout Now
          </Button>
          <AlertDialogAction onClick={onStayLoggedIn}>Stay Logged In</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SessionTimeoutWarning; 