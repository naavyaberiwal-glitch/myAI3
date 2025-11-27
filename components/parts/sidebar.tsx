// components/parts/sidebar.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { ArchiveBox, Plus, Clock, ChevronLeft } from "lucide-react";

type ChatSummary = {
  id: string;
  title: string;
  createdAt: string;
  messages: any[];
  durations?: Record<string, number>;
};

type Props = {
  history: ChatSummary[];
  onNewChat: () => void;
  onLoadChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onGeneratePlan: (type?: "insert" | "send") => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
};

export function Sidebar({
  history,
  onNewChat,
  onLoadChat,
  onDeleteChat,
  onGeneratePlan,
  collapsed = false,
  onToggleCollapse,
}: Props) {
  return (
    <aside
      className={`hidden md:flex flex-col w-72 shrink-0 p-4 gap-4 ${
        collapsed ? "opacity-0 pointer-events-none" : ""
      }`}
    >
      <div className="soft-card flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">Greanly</div>
          <div className="text-xs text-stone-500">Your sustainability assistant</div>
        </div>
        <div className="flex flex-col gap-2">
          <Button size="icon" className="btn-ghost" onClick={onToggleCollapse}>
            <ChevronLeft size={18} />
          </Button>
        </div>
      </div>

      {/* New Chat */}
      <div className="soft-card">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Start</div>
            <div className="text-xs text-stone-500">Start a fresh chat</div>
          </div>
          <Button onClick={onNewChat} className="bg-brand">
            <Plus size={16} />
            <span className="ml-2">New</span>
          </Button>
        </div>

        <div className="mt-3 border-t pt-3">
          <div className="text-sm font-medium">Quick templates</div>
          <div className="mt-2 flex flex-col gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onGeneratePlan("insert")}
            >
              30-60-90 Plan (insert)
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onGeneratePlan("send")}
            >
              30-60-90 Plan (send now)
            </Button>
          </div>
        </div>
      </div>

      {/* History */}
      <div className="soft-card flex-1 overflow-auto">
        <div className="flex items-center justify-between mb-2">
          <div className="font-medium">Previous chats</div>
          <div className="text-xs text-stone-500">{history.length}</div>
        </div>

        {history.length === 0 ? (
          <div className="text-sm text-stone-500">No previous chats yet.</div>
        ) : (
          <ul className="flex flex-col gap-2">
            {history.map((h) => (
              <li
                key={h.id}
                className="flex items-center justify-between gap-2 p-2 rounded-md hover:bg-neutral-50 cursor-pointer"
              >
                <div
                  className="flex-1 pr-2"
                  onClick={() => onLoadChat(h.id)}
                  title={h.title}
                >
                  <div className="font-medium text-sm truncate">{h.title}</div>
                  <div className="text-xs text-stone-500 mt-1">
                    {new Date(h.createdAt).toLocaleString()}
                  </div>
                </div>

                <div className="flex gap-2 items-center">
                  <Button
                    size="icon"
                    variant="ghost"
                    title="Load chat"
                    onClick={() => onLoadChat(h.id)}
                  >
                    <ArchiveBox size={16} />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    title="Delete chat"
                    onClick={() => onDeleteChat(h.id)}
                  >
                    <span className="text-xs text-red-500">×</span>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="text-xs text-stone-500">
        Tip: use New to archive current chat before starting a fresh one.
      </div>
    </aside>
  );
}
