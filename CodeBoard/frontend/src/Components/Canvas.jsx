import { useEffect, useState, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Tldraw,
  DefaultColorThemePalette,
  defaultShapeUtils,
  createTLStore,
  throttle,
  createPresenceStateDerivation,
  atom,
} from "tldraw";
import ACTIONS from "../Actions";

DefaultColorThemePalette.lightMode.black.solid = "white";

function generateRandomColor() {
  const red = Math.floor(Math.random() * 256);
  const green = Math.floor(Math.random() * 256);
  const blue = Math.floor(Math.random() * 256);

  const color =
    "#" + ((1 << 24) + (red << 16) + (green << 8) + blue).toString(16).slice(1);

  return color;
}

function Canvas({ socketRef, roomId, username, newCanvasChanges, canvasData, currentTab }) {
  const editorRef = useRef(null);
  
  const [store] = useState(() => {
    const store = createTLStore({
      shapeUtils: [...defaultShapeUtils],
    });
    return store;
  });

  const currentUser = useState(() => {
    return atom("user", {
      id: uuidv4(),
      name: username,
      color: generateRandomColor(),
    });
  })[0];

  const userPresence = createPresenceStateDerivation(currentUser)(store);

  // Handle incoming canvas changes from other users
  useEffect(() => {
    if (!newCanvasChanges || newCanvasChanges.length === 0) return;

    console.log("Received canvas changes from other users:", newCanvasChanges);
    
    store.mergeRemoteChanges(() => {
      for (const update of newCanvasChanges) {
        const {
          changes: { added, updated, removed },
        } = update;

        for (const record of Object.values(added)) {
          store.put([record]);
        }
        for (const [, to] of Object.values(updated)) {
          store.put([to]);
        }
        for (const record of Object.values(removed)) {
          store.remove([record.id]);
        }
      }
    });
  }, [newCanvasChanges, store]);

  // Send canvas changes to other users
  useEffect(() => {
    const pendingChanges = [];
    
    const sendCanvasChanges = throttle(() => {
      if (pendingChanges.length === 0) return;
      
      console.log("Sending canvas changes to other users:", pendingChanges);
      
      socketRef.current.emit(ACTIONS.CANVAS_CHANGE, {
        type: "update",
        username,
        roomId,
        newChanges: pendingChanges.slice(), // Create a copy
      });
      
      pendingChanges.length = 0;
    }, 100);

    const handleCanvasChanges = (event) => {
      if (event.source !== "user") return;
      
      // Filter out irrelevant events
      const updatedChanges = event.changes.updated;
      const keys = Object.keys(updatedChanges);
      
      const dontPropagateEvent = keys.every(
        (key) =>
          key === "pointer:pointer" ||
          key === "instance:instance" ||
          key === "camera:page:page"
      );

      if (!dontPropagateEvent) {
        console.log("User made canvas change:", event);
        pendingChanges.push(event);
        sendCanvasChanges();
      }
    };

    // Store the unsubscribe function returned by listen
    const unsubscribe = store.listen(handleCanvasChanges);
    
    // Return the unsubscribe function for cleanup
    return () => {
      unsubscribe();
    };
  }, [store, socketRef, roomId, username]);

  // Listen for user presence updates
  useEffect(() => {
    if (!socketRef.current) return;
    
    const handlePresenceUpdate = ({ presences }) => {
      if (presences && presences.length > 0) {
        console.log("Received presence updates:", presences);
        // Update presence indicators for other users
      }
    };
    
    socketRef.current.on("user-presence-update", handlePresenceUpdate);
    
    return () => {
      socketRef.current.off("user-presence-update", handlePresenceUpdate);
    };
  }, [socketRef]);

  // Show/hide canvas based on current tab
  useEffect(() => {
    if (currentTab === "canvas" && editorRef.current) {
      // Force a re-render of the canvas when switching to it
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.updateViewportScreenBounds();
        }
      }, 100);
    }
  }, [currentTab]);

  return (
    <div className="fixed top-0 bottom-0 right-0 left-0 lg:left-[49px]">
      <Tldraw
        store={store}
        onMount={(editor) => {
          editorRef.current = editor;
          editor.user.updateUserPreferences({
            isDarkMode: true,
            isSnapMode: true,
          });
          
          console.log("Canvas mounted with editor:", editor);
          
          // Load existing canvas data if available
          if (canvasData && canvasData.length > 0) {
            for (const update of canvasData) {
              editor.store.mergeRemoteChanges(() => {
                const {
                  changes: { added, updated, removed },
                } = update;

                for (const record of Object.values(added)) {
                  editor.store.put([record]);
                }
                for (const [, to] of Object.values(updated)) {
                  editor.store.put([to]);
                }
                for (const record of Object.values(removed)) {
                  editor.store.remove([record.id]);
                }
              });
            }
          }
        }}
      />
    </div>
  );
}

export default Canvas;
