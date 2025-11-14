'use client';

import { ChatInterface } from '@/components/chat/ChatInterface';

export default function MentorPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">AI Career Mentor</h1>
      <p className="text-gray-600 mb-8">
        Get personalized career advice from our AI mentor. You can switch between different mentor personas 
        using the dropdown menu in the chat interface.
      </p>
      <div className="max-w-4xl mx-auto">
        <ChatInterface />
      </div>
    </div>
  );
}
