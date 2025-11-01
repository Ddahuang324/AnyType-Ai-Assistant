import React, { RefObject } from 'react';
import type { Message, ChatHistoryItem, Blueprint } from '../types';
import BlueprintIcon from './icons/BlueprintIcon';

interface ChatMessagesProps {
    messages: Message[];
    isLoading: boolean;
    activeChatId: string | null;
    activeBlueprintId: string | null;
    blueprints: Blueprint[];
    chatHistory: ChatHistoryItem[];
    onSelectChat: (chatId: string) => void;
    messagesEndRef: RefObject<HTMLDivElement>;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({
    messages,
    isLoading,
    activeChatId,
    activeBlueprintId,
    blueprints,
    chatHistory,
    onSelectChat,
    messagesEndRef,
}) => {

    if (activeChatId) {
        return (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
                <div
                key={msg.id}
                className={`flex animate-fade-in-up ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                <div
                    className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl ${
                    msg.role === 'user'
                        ? 'bg-brand-primary text-white rounded-br-none'
                        : 'bg-ui-background text-text-primary rounded-bl-none border border-border'
                    }`}
                >
                    <p className="text-sm break-words whitespace-pre-wrap">{msg.text}</p>
                </div>
                </div>
            ))}
            {isLoading && (
                <div className="flex justify-start animate-fade-in-up">
                <div className="px-4 py-3 rounded-2xl bg-ui-background text-text-primary rounded-bl-none border border-border">
                    <div className="flex items-center space-x-2">
                    <span className="h-2 w-2 bg-text-secondary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="h-2 w-2 bg-text-secondary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="h-2 w-2 bg-text-secondary rounded-full animate-bounce"></span>
                    </div>
                </div>
                </div>
            )}
            <div ref={messagesEndRef} />
            </div>
        );
    }

    if (activeBlueprintId) {
        const blueprint = blueprints.find(p => p.id === activeBlueprintId);
        const relatedChats = chatHistory.filter(c => c.blueprintId === activeBlueprintId);
        if (!blueprint) return null;

        return (
            <div className="flex-1 w-full flex flex-col items-center justify-center p-4 md:p-8 bg-background">
            <div className="text-center max-w-2xl">
                <div className="inline-flex items-center justify-center bg-brand-primary p-4 rounded-full mb-4">
                    <BlueprintIcon />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-text-primary">{blueprint.title}</h1>
                <p className="text-text-secondary mt-2 mb-8">{blueprint.prompt}</p>

                {relatedChats.length > 0 && (
                    <div className="text-left w-full">
                        <h3 className="font-semibold text-text-secondary mb-2">Recent</h3>
                        <ul className="space-y-2">
                            {relatedChats.slice(0, 3).map(chat => (
                                <li key={chat.id}>
                                    <button onClick={() => onSelectChat(chat.id)} className="w-full text-left p-3 bg-ui-background hover:bg-ui-hover-background rounded-lg transition-colors">
                                        <p className="truncate text-sm text-text-primary">{chat.title}</p>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
            </div>
        );
    }

    return (
        <div className="flex-1 w-full flex flex-col items-center justify-center p-4 md:p-8 bg-background">
            <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-text-primary">AI Assistant</h1>
            <p className="text-text-secondary mt-2">Select a chat, start a new one, or use a blueprint from the sidebar.</p>
            </div>
        </div>
    );
};

export default React.memo(ChatMessages);