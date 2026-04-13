1. Files and their usage: 

A. app.js:
    -> app = express()
    -> httpServer = createServer(app)
    -> establish socket io connection for live update (adv: check later)
    -> register middlewares using app.use()    
    1. cors: app.use(cors({ origin: process.env.CLIENT_URL , credentials: true })) : since browser blocks request from 2 diff origins
    1st arg: only allows BE request fron front end url
    2nd arg: allows cookies, jwt 
    2. app.use(express.json()):
    since ui sends a json payload, if we dont use this middlweare before calling the routes, we will get req.body = undefined
    3. app.use(mogan('dev')):
    morgan lib is used for logging api calls, we lg in dev mode for more precise and short logs: 
    POST /api/auth/login 200 871.969 ms - 420
    GET /api/bugs 200 95.710 ms - 18017
    -> we resister the routes here, these are express.router that we export from the routes
    -> then we init db and qdrant coll and then we start the server at port 5000

B. config/db.js:

-> init and configures mongodb
-> we use mongoose.connect to connect with mongoose url string 
-> mongoose.connection.on("disconnect", ()=> {warning for disconnect})
-< we export the async fun connectdb where monggose.connect was called

C. qdrant.js:
-> we import QdrantClient from @qdrant/js-client-rest
-> init qdrantClient object of class QdrantClient
-> we export qdrantClient in which we await on qdrantClient.getcollections
-> we check if it exists do nothing 
-> if not exists: use qdrantClient.createCollection and create the qdrant collection QDRANT_COLLECTION=bugsense_bugs

D. Mongoose models:
-> Bug.js: 
-> we have bugSchema = new mongoose.Schema({
    with fields like title, descriptim,ai and timeline are foreign keys 
    ai: { type: aiResultSchema , default: null}
    embeddingId 
    and timeline: [timelineEventSchema]
})
-> User.js
-> we have simple userSchema 
-> password: { type: String, required: true, minlength: 6, select: false },
select false: password is not returned by default in queries
-> Pre-save Middleware : This runs before saving user to DB
userschema.pre() used this to hash passw before saving, next is called since its a middleware

-> exposed a comparePassword method
used to check if password matches on login route: await user.comparePassword(password)

-> overriden toJSON to not expose the password if user.toJson() called 

E. auth.js route:
route -> service 

lets see a auth route: register:
const router = express.Router();

router.post("/register", async(req,res,next) => {
    try{
        take fields from req.body
        int the User (thats a mongoose model) we use create method
        we use jwt.sign as well to generate a token 
    }
})

2. The AI Pipeline: 
in route: POST /api/bugs we are triggering the ai pipeline:

i.> before route works it goes into protect middleware, i.e user must be logged in or have a valid jwt token in headers to use this api

auth.js middleware: 
export const protect = async (req,res,next) => {
    // 1: in authHeader = req.headers.authorization , check if this authHeader exists if not 401 : 
    authheader: Bearer <Token>
    // 2: find the user by token:
    const decoded = jwt.verify( authHeader.split(' ')[1], process.env.JWT_SECRET)
    // 3: User.findById(decoded.id) , if user exists then 
    ->req.user=user
    -> next()
    // 4: if in catch: 401 
}

ii.> create a bug: await Bug.create

iii.> Generate embedding
flow goes from route-> bugservice.js: AI PIPELINE
call generateBugEmbedding in embeddingservice
Here we are generating embeddings of the new bug created with details like title,comp,desc,logs conv to embedings using gemini-embeding-001 model 

how connecting with gemini:
let ai = new GoogleGenAi({apikey: })
gen embedings: await ai.models.embedContent({
    model: 
    contents: 
    config
})

iv. Find similar bugs
we have got the embeddings generated from embeddingservice, 
now we call searchSimilarBugs(embedding, bug._id) in VectorService

in VectorService we use qdrantClient we exported from qdrant.js 
await qdrantclien.serach(COLLECTION_NAME,{
    vector // Array.from(embeddings)
    limit: limit+1
    ...
}
semanticSearch returns an obj wih bugid component and score 
 similarVectors from Qdrant looks like:
[
  { bugId: "69b66aa983e8737dfa9605aa", score: 0.91 },
  { bugId: "69b66f04fe5cdad808b21d65", score: 0.87 },
]
)

Now important :
V: COnvert the mogoose bugid to human readable bugId:
since vector db returns us  { bugId: "69b66aa983e8737dfa9605aa", score: 0.91 }, we cant pass this as conext to llm , we use mongoose Bug.find and  Fetch bug IDs to display as BUG-XXXX format
// Result:
[
  { bugId: "BUG-9605AA", score: 0.91 },
  { bugId: "BUG-B21D65", score: 0.87 },
]
// This is what gets passed to Groq prompt:
"Similar past bugs: BUG-9605AA (91% match), BUG-B21D65 (87% match)"
Without it, the LLM prompt would say "Similar past bugs: 69b66aa983e8737dfa9605aa" which is meaningless, and the frontend bug detail page would show raw ObjectIds instead of BUG-XXXXXX links.

VI. LLM CALL:
Next up once we have got the top 5 most relavant chunks(note treshold is 0.82 so if only 3 meets then only 3 is passed to llm)
now we call analyzeBugWithAI in aiService.js

similar to gemini we call the Groq cand pass the GROQ_API_KEY
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

llm is called with prompt including the bugids to give suggestedPriority of the newly created bug with this route 
const completion = await roq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    message: prompt,
    temperature: 0.3,
    max_tokens: 300
})
return the parse response fropm llm containg suggested proiority

VII. Storing the new bug with AI predicted priority in qdrant:
we call upsertBugVector in vectorservce

again we use qdrantClient here :
qdrantClient.upsert (COLLECTION_NAME ,{
    points: [{
        vector, other details
    }]
})
In this way newly precited category is also inserted in our vector db

VIII
the bug that we inserted in mongodb is now updated with ai predcited priotiry abd aissgnee 
we store the similar bugs, ai predcited priortiy and duplicateOf : checks if the first similar bug retreievd from vectordb has similarity score of 0.93 or higher , if yes its most probably a dublicae one so we store in vector db 
await Bug.findByIdAndUpdate updatesthe Bug doc in mongodb
we also have Audit Trail: The timeline event creates a log entry, which can be displayed in the bug's history (e.g., "AI analyzed this on [date] and suggested changes").

IX: Emit real-time event : SOCKET IO
this is the socket io+live update part : This enables instant UI updates without requiring manual refreshes or polling.
io we passed from the POST route: req.app.get('io');
the event name 'bug:ai_analyzed'
in front end we have webhooks that would listen top these live updates 
we will check later
socket.on('bug:ai_analyzed', (data) => {
  onEvent(data); // Trigger UI update
});
01
With this we have seen all the files in detail
just final file in BE:
seed.js:
database seeding script used to populate the application's databases (MongoDB and Qdrant) with initial sample data for development, testing, or demo purposes.
It mimics the real AI pipeline 

3. Live update Flow: Client A creates a bug and Client B sees a toast notification

PHASE 1: Server Boot — Setting Up the WebSocket Server
A. Creates a raw Node.js HTTP server wrapping Express :
app.js:16    const httpServer = createServer(app) 

B. Creates a Socket.io server and attaches it to the HTTP serve

app.js:19-21  const io = new Server(httpServer, {
                cors: { origin: process.env.CLIENT_URL, methods: ['GET','POST'] }
              })
This means the same localhost:5000 now handles both REST API requests (via Express) and WebSocket connections (via Socket.io)

C. This is the critical bridge. Stores the io instance on the Express app so any route handler can later access it via req.app.get('io'). Without this, your routes have no way to emit socket events.

app.set('io', io);

D. we call setupSocket back-end\src\socket\bugEvents.js 
io.on('connection', (socket) => {
                    console.log(`🔌 Client connected: ${socket.id}`)
                    // listens for bug:join and bug:leave for room management
                  })

With this our socket io forlive update i setup, server is listening for both HTTP Requests and websocket conn on port 5000!

PHASE 2: Client B Logs In — WebSocket Connection Established
App.jsx:46-50
 <AppInner /> this is the ui entry pnt, it calls the hook useWebSocket 

useWebSocket: takes the bugs, isUserLoggedIN and a CB fun 
->  useEffect(() => { onEventRef.current = onEvent; }, [onEvent]);
Every time the parent re-renders with a new callback useEffect is called , this keeps the ref up to date. The socket listeners always call onEventRef.current(...) so they always use the latest callback.

useWebSocket.js:22-26   const socket = io(config.socketUrl, {
                          transports: ['websocket', 'polling'],
                          reconnectionAttempts: 5,
                          reconnectionDelay: 2000,
                        })
io() here is the socket.io-client io function (not the server). It opens a WebSocket connection to http://localhost:5000. The transports array means: try WebSocket first, fall back to HTTP long-polling if WebSocket fails. Reconnection config: retry 5 times, 2 seconds apart.

socket.on('connect',()=>
 this cb triggers when 
 When the connection succeeds, a toast is shown on Client B: "Connected to BugSense live updates".
)

-> Now the critical listener:
socket.on('bug:ai_analyzed', (data) => {
      onEventRef.current({ id: Date.now(), variant: 'success', ...data });
});
Client B is now listening for bug:ai_analyzed events. When one arrives, it calls onEventRef.current(...) which is the callback from App.jsx:46-49.
i.e we have:
if (event.type === 'bug:ai_analyzed') loadBugs(); 
Client B is now fully connected and waiting. 

PHASE 3: Client A Creates a Bug — HTTP Request

Here the same AI peipeline runs that we already discussed above 
runAIPipeline(bug, io).catch(console.error)
This is the key line. Notice: no await. The function is called but the route handler doesn't wait for it. This is fire-and-forget. The AI pipeline runs in the background while Client A already sees the bug.

Now the pipeline has succeded, AI has predicted the Priority/ Root Cause/assignee/ 

PHASE 4: Socket Emit — The Live Update
In BugService we have:
// Step 7 — Emit real-time event to frontend
    if (io) {
      io.emit('bug:ai_analyzed', {
        bugId:   updatedBug.bugId,
        message: `${updatedBug.bugId} analyzed — ${aiResult.suggestedPriority} priority → ${aiResult.suggestedAssignee}`,
        actor:   'BugSense AI',
        variant: 'success',
        bug:     updatedBug,
      });
    }
io.emit(...) broadcasts to every connected socket client. Both Client A and Client B receive this event.

PHASE 5: Client B Receives the Event — Toast Appears
Back in Client B's browser, the listener from Phase 2 fires:

useWebSocket.js:51   socket.on('bug:ai_analyzed', (data) => {
                       onEventRef.current({ id: Date.now(), variant: 'success', ...data })
                     })
onEventRef.current points to the callback from App.jsx:46-49: addToast(event)   
Also calls loadBugs() which does GET /api/bugs to refresh the entire bug list from the API. Client B's dashboard now shows the new bug with its AI-assigned priority.

4. Live update Flow: Client A changes bug status and Client B sees a toast notification

Socket IO setup its the same , in app.js we had:
app.set('io', io);  making  io accessible in routes via req.app.get('io')

So now we move to the // PATCH /api/bugs/:id route: 
 const io = req.app.get('io');
 io?.emit('bug:updated', {
        bugId:   bug.bugId,
        message: `${bug.bugId} status → ${status}`,
        actor:   req.user.name,
        variant: 'info',
      });

Client A emits the event bug:updated

Client B was listening to the websocket:
socket.on('bug:updated', (data) => {
      onEventRef.current({ id: Date.now(), variant: 'info', ...data });
    });
Again the CB is replaced with latest and the hook is called top give the toast notifications to all the clients listening to this webscocket 
useWebSocket(bugs, (event) => {
    addToast(event);
    // Refresh bugs list when AI analysis completes
    if (event.type === 'bug:ai_analyzed') loadBugs();
  }, isAuthenticated);


Client A  ──HTTP PATCH──►  Server  ──socket emit──►  Client B
                                   ──socket emit──►  Client A (also receives it)