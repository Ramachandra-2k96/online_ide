let editor;

window.onload = function() {
    editor = ace.edit("editor");
    editor.setTheme("ace/theme/chrome");
    editor.session.setMode("ace/mode/python");
    loadFirebase();
}

//configuration contents get it from firebase
const firebaseConfig = {
    apiKey: "AIzaSyA0bQU9QWhULk7qoQcaUSUyv37e81AWp8Q",
    authDomain: "realtimecolab.firebaseapp.com",
    projectId: "realtimecolab",
    storageBucket: "realtimecolab.appspot.com",
    messagingSenderId: "413588146364",
    appId: "1:413588146364:web:4963a181276b51730fa8b9"
};
function loadFirebase() {
    // Check if Firebase is not already initialized
if (!firebase.apps.length) {
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
}
// Reference to the Firebase Realtime Database
const database = firebase.database();

// Reference to the 'editor' node in the database
const editorRef = database.ref('editor');

// Get the Ace editor element by ID ('editor' in this case)
const editor = ace.edit('editor');

// Set up a one-time listener for initial data retrieval
editorRef.on('value', (snapshot) => {
    const data = snapshot.val();

    if (data) {
        const { content, cursorPosition, selection } = data;

        editor.off('change', onEditorChange);

        const editorSession = editor.getSession();

        // Update editor content only if it's different
        if (content !== editorSession.getValue()) {
            editorSession.setValue(content);
        }

        // Set the cursor position
        if (cursorPosition && cursorPosition.row !== undefined && cursorPosition.column !== undefined) {
            editor.gotoLine(cursorPosition.row + 1, cursorPosition.column);
        }
        // Set the selection range
        if (selection && selection.start && selection.end) {
            const startRow = selection.start.row !== undefined ? selection.start.row : 0;
            const startColumn = selection.start.column !== undefined ? selection.start.column : 0;
            const endRow = selection.end.row !== undefined ? selection.end.row : 0;
            const endColumn = selection.end.column !== undefined ? selection.end.column : 0;

            editorSession.getSelection().setSelectionRange({
                start: { row: startRow, column: startColumn },
                end: { row: endRow, column: endColumn }
            });
        }

        editor.on('change', onEditorChange);
    }
});


// Set up a listener for subsequent changes in the editor and update the database
function onEditorChange(delta) {
    const editorSession = editor.getSession();
    const currentContent = editorSession.getValue();
    const cursorPosition = editorSession.getSelection().getCursor();
    const selection = editorSession.getSelection().getRange();

    // Update only the necessary fields in the database
    editorRef.update({
        content: currentContent,
        cursorPosition: cursorPosition,
        'selection/start': { row: selection.start.row, column: selection.start.column },
        'selection/end': { row: selection.end.row, column: selection.end.column+1 }
    });
}

// Set up the initial 'change' event listener
editor.on('change', onEditorChange);

    
    //Mouse updates
    function startmouse_updates()
    {
        const mousePointer = document.createElement('div'); 
        // mouse updates
        mousePointer.classList.add('mouse-pointer'); // Add the mouse-pointer class to the created div
                document.body.appendChild(mousePointer); // Append the mouse pointer to the body
        
                // Get a reference to the database path for user information
                const usersRef = database.ref('users');
        
                // Generate a unique user ID based on device details
                const currentUserId = generateUserId();
        
                function generateUserId() {
                    const userAgent = navigator.userAgent;
                    const platform = navigator.platform;
                    const sanitizedUserId = `${userAgent}-${platform}`.replace(/[.#$/[\]]/g, '_');
                    return sanitizedUserId;
                }
        
                // Listen for changes in user information
                usersRef.on('value', (snapshot) => {
                    const users = snapshot.val();
                    updateMousePointers(users);
                });
        
                // Update the mouse pointers based on the received user information
                function updateMousePointers(users) {
                    // Clear existing mouse pointers
                    document.querySelectorAll('.mouse-pointer').forEach((pointer) => {
                        pointer.remove();
                    });
        
                    for (const userId in users) {
                        if (userId !== currentUserId) {
                            const { x, y } = users[userId];
                            displayMousePointer(userId, x, y);
                        }
                    }
                }
        
                // Display the mouse pointer at the specified position
                function displayMousePointer(userId, x, y) {
                    const pointer = document.createElement('div');
                    pointer.classList.add('mouse-pointer');
                    pointer.id = `mouse-pointer-${userId}`;
                    pointer.style.left = `${x}px`;
                    pointer.style.top = `${y}px`;
        
                    // Assign a unique color based on the user ID
                    const color = generateColor(userId);
                    pointer.style.backgroundColor = color;
        
                    document.body.appendChild(pointer);
                }
        
                // Listen for mouse movements and update the database
                document.addEventListener('mousemove', (e) => {
                    const { clientX, clientY } = e;
                    usersRef.child(currentUserId).set({
                        x: clientX,
                        y: clientY
                    });
                });
        
                // Remove user details from the database and hide the mouse pointer when visibility changes
                document.addEventListener('visibilitychange', () => {
                    if (document.visibilityState === 'hidden') {
                        removeUserDetails();
                    }
                });
        
                window.addEventListener('beforeunload', () => {
                    removeUserDetails();
                });
        
                function removeUserDetails() {
                    usersRef.child(currentUserId).remove(); // Remove user details from the database
                }
        
                // Generate a color based on the user ID
                function generateColor(userId) {
                    let hash = 0;
                    for (let i = 0; i < userId.length; i++) {
                        hash = userId.charCodeAt(i) + ((hash << 5) - hash);
                    }
                    const color = Math.abs(hash % 360);
                    return `hsl(${color}, 70%, 50%)`;
                }
            }
            startmouse_updates();
}
function changeLanguage()
{
    var selectedLanguage = document.getElementById("languages").value;
    switch (selectedLanguage) {
        case "java":
            alert("You selected JAVA!");
            editor.session.setMode("ace/mode/java");
            break;
        case "python":
            alert("You selected Python!");
            editor.session.setMode("ace/mode/python");
            break;
        default:
            break;
    }
}

function executeCode() {
    $.ajax({
        url: "/compile_code/",
        method: "POST",
        data: {
            language: $("#languages").val(),
            code: editor.getSession().getValue()
        },
        success: function(response) {
            var formattedOutput = "<div class='output-section'>";
            formattedOutput += "<div class='output-header'><strong>Command:</strong> " + response.command + "</div>";
            formattedOutput += "<div class='output-body'><div class='out'>Output:</div><br><pre>" + response.output + "</pre></div>";

            if (response.error) {
                formattedOutput += "<div class='output-error'><strong>Error:</strong><br><pre>" + response.error + "</pre></div>";
            }

            formattedOutput += "</div>";
            
            $(".output").html(formattedOutput);
        },
        error: function(xhr, status, error) {
            console.error('Error during compilation:', error);
            var errorMessage = "Error during compilation. Please check the console for more details.";
            $(".output").html("<div class='output-error'><strong>Error:</strong> " + errorMessage + "</div>");
        }
    });
}



