import React from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

interface CreateLobbyButtonProps {
  onClick: () => void;
}

const CreateLobbyButton: React.FC<CreateLobbyButtonProps> = ({ onClick }) => {
  return (
    <Button onClick={onClick} className="create-lobby-button" size="lg">
      <PlusCircle className="h-5 w-5" />
      Create New Lobby
    </Button>
  );
};

export default CreateLobbyButton;
