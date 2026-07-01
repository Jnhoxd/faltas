import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface StudentEmailProps {
  email: string;
}

export function StudentEmail({ email }: StudentEmailProps) {
  const [showEmail, setShowEmail] = useState(false);
  
  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1***$3');
  
  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-600 text-sm">
        {showEmail ? email : maskedEmail}
      </span>
      <button
        onClick={() => setShowEmail(!showEmail)}
        className="p-1 text-gray-400 hover:text-gray-600"
        title={showEmail ? "Ocultar email" : "Mostrar email"}
      >
        {showEmail ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}