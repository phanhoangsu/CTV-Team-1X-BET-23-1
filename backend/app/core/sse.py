import queue
import json

class MessageAnnouncer:
    def __init__(self):
        self.listeners = {} # user_id -> list of queues

    def listen(self, user_id):
        q = queue.Queue(maxsize=50)
        if user_id not in self.listeners:
            self.listeners[user_id] = []
        self.listeners[user_id].append(q)
        return q

    def announce(self, user_id, event, data):
        if user_id in self.listeners:
            msg = f"event: {event}\ndata: {json.dumps(data)}\n\n"
            # Send to all connected clients for this user
            # We iterate backwards so we can remove safely if needed
            for i in reversed(range(len(self.listeners[user_id]))):
                try:
                    self.listeners[user_id][i].put_nowait(msg)
                except queue.Full:
                    del self.listeners[user_id][i]

announcer = MessageAnnouncer()
