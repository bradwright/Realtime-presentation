Who am I?
=========

- Australian, where I worked for an agency making websites for many reputable brands. In case you're wanting to ask questions after the conference, I, like all Australians, don't drink Fosters.
- Head of Web Development at betting exchange Smarkets, a London-based startup
- Web developer for 10 years, including two years at Yahoo! as a senior developer
- My background in this specific topic is that we've been doing various forms of real-time odds and sports data for a few years now. This talk is based on all the things I've learned, and also because there doesn't seem to be any definitive resource with this information

How we use real-time technology
===============================

- Smarkets is an online betting exchange
- We allow users to trade binary futures in sporting and entertainment outcomes
- We need real-time delivery to guarantee customers have up to date odds
- We have social elements that require interaction with other customers
- We also publish live scores and sporting data

A short demo
============

- This is where we test out Gavin's claim that "(t)he Sage Gateshead probably has the most rock-solid wifi/public internet connection in the entirety of the North East of England";
- Visit `dibi2011.intranation.com`__
- This entire presentation *is* a real-time web application
- The slides on your screen should keep up with mine as I advance (unless I broke it)

__ http://dibi2011.intranation.com/

What does "real time web programming" mean?
===========================================

- Real time web programming, for the purposes of this talk, is in-browser real-time communication
- It requires Javascript, and sometimes Flash, to create this connection
- It usually requires a special server stack
- This talk is mostly about the ridiculous things you need to make browsers do, with the benefits and caveats of each, and how to implement and scale the server side

Real world web examples
=======================

- Google Talk and (before that, Gmail) were one of the first mainstream examples of real-time applications in the browser. Gmail pioneered the forever-iframe technique in 2006 to deliver quasi-real-time updates on new email
- Meebo, the in-browser multi-protocol IM client (and apparently check-in service, now), uses long-polling in Chrome to implement instant messaging in the browser
- IRCCloud, a London-based startup by some ex-Last.fm employees, uses WebSockets to provide a web-based IRC client
- Facebook chat uses an `Erlang backend and Ajax long-polling`__ to implement browser chat
- Google finance uses multi-part and forever iframes to send you live stock quotes as you watch graphs
- Word Squared, an online multi-player scrabble game, `uses websockets and Node.js`__. They push notifications to the browser via my office mates in London `Pusher`__.

__ http://www.scribd.com/doc/22428456/Erlang-at-Facebook
__ http://www.startupmonkeys.com/2010/09/building-a-scrabble-mmo-in-48-hours/
__ http://pusher.com/

Why would I want it?
====================

In all honesty, not all applications really need push updates. Here are a few ideas I came up with (I accept equity as thanks if any of these turn into successful businesses after this talk):

- Ticketmaster

  - Serve basic pages from high speed web servers
  - Serve queue/availability information from cache initially, then update live with WebSockers
  - Storing queue information in a cookie or session means even over refreshes the user stays at their point in the queue
  - Helps alleviate thundering herd issues with people reloading constantly, as Nginx or Varnish can serve thousands of requests a second from cache (maybe the DIBI site could do with this architecture next year?)

- Live chat and social networks

  - Presence indicators (you have 5 friends online)
  - Live chat
  - Live messaging ("so and so sent you a private message")
  - Incidentally, new Twitter uses regular polling with a 500ms timeout, which is disappointing given their real-time streaming API

- Financial applications

  - To the second quotes and prices are important
  - Real-time notification of swings or news events
  - Chat with other traders (think Bloomberg terminals)
  - Scales to mobile devices since it's just a web app

- Live sports or entertainment

  - Live scores, commentary, statistics
  - Live voting (like Eurovision)
  - Chat with other fans

- Online gaming

  - Pretty obvious, this one!

- Collaboration and document sites

  - Google Docs uses real-time push communication to send keystroke and other information to all clients

Smarkets, my employer, uses real-time updates for odds/quantity, sports data, and real-time chat with other fans.

How does it work?
=================

- This part of the talk is broken down into 3 sections:
- The old way:

  - Some of these techniques are as old as Ajax itself, so circa
  - We detail the various hacks and ways that people have previously done push updates (why I use scare quotes around push will become clear)
  - We examine the pitfalls and benefits of each way
  - All this is really to impress on you that these techniques are hacky and experimental, so caution should be used when building The Future™

- The current (or upcoming, given it's all about as current as HTML 5 or CSS 3) standard:

  - Spoiler: it's WebSockets
  - There's another standard similar to long polling: Server Sent Events

- The elephant in the room:

  - There's a well-known security issue with the interaction between WebSockets and transparent proxies, which we'll talk about

Polling
=======

- Works with regular Ajax and ``window.setTimeout``
- Doesn't require a special server
- Problems:

  - Excessive network latency from many HTTP requests
  - Makes the server and client do work for potentially no reason - Data might not have changed between polls

- If you must do long polling (legacy server architecture, shared hosting), Best practice is to use ``If-Modified-Since`` on the client and return 304 responses to cut down on browser/network payload

Long-polling
============

- Basically server holds connection open until it has something to send
- Reduces latency and "has anything changed?" issues introduced by polling
- However, it requires a custom server and application stack

  - Apache (or another standard prefork server) will just run out of workers

    - Imagine you spawn 60 prefork workers
    - After 60 Ajax long-polling connections your server can no longer serve requests, as they're all being held

  - Still not entirely efficient: when you return a response the client has to create and connect with a new request

- Best practice is to batch data for a short time so that you maximise efficiency in the connection window (which requires a bit of a dirty server side logic fork)
- Use keep-alive to play nicely with servers and proxies;

Comet
=====

- Comet is more formally known as "The Bayeux protocol"
- Combination of long-polling and JSONP polling on the server - code has already been written for you
- Added handshake for some client/server verification
- Slightly complex, requires a custom Java server (and thus lots of XML)

Dynamic script elements
=======================

- Fully cross domain
- Widely supported
- Lacks timeout features, as browsers never report that a script element didn't load
- Quasi-evented by way of JSONP callback firing when it returns
- To work around unknown timeouts:

  - Generate a sequence number, send with request
  - Always return after 60 seconds whether you have data or not
  - If returned sequence number of request is different from current on client, reset state and begin again (assuming you're only sending diffs)

- Reference__

__ http://www.olivepeak.com/blog/posts/read/implementing-script-tag-long-polling-for-comet-applications

Forever iframe
==============

- Transferred via dynamic ``iframe``
- Uses ``connection: keep-alive`` and ``Transfer-encoding: chunked`` to serve chunks of content into the ``iframe``
- ``iframe`` inserts dynamic ``script`` elements that invoke a function in the parent window (like JSONP)
- Constantly loading in most browsers, which is a bad user experience: unless you're on IE, then you use an (surprise!) ActiveXControl called ``htmlfile``;
- Google Talk team discovered this, `according to Dojo's Alex Russell`__

__ http://infrequently.org/2006/02/what-else-is-burried-down-in-the-depths-of-googles-amazing-javascript/

WebSockets
==========

- I've been leading up to this all along - it's the one protocol to rule them all;
- It's close enough to a proper socket - communication is incredibly rapid;
- Doesn't require many HTTP connections - just a single mostly latent socket to each client;
- As most things in HTML5, it has well defined DOM and error handling characteristics (as the HTML5 specs are mostly based on what authors are doing in the wild and need to know to write services and browsers);
- Bidirectional communication with the server - clients can send messages to the server via the socket;
- Uses HTTP 1.1 Upgrade header;
- Looks like HTTP, but isn't;

  - This point is important, as it means WebSockets doesn't play nicely with some proxies as things currently stand;
  - The new spec helps with this by encrypting the traffic to not look like HTTP anymore;

- Requires handshake for authentication (as it opens a socket);
- `Current spec`__
- Great `Stack Overflow`__ question on all things WebSockets;

__ http://dev.w3.org/html5/websockets/
__ http://stackoverflow.com/questions/4262543/what-are-good-resources-for-learning-html-5-websockets

WebSockets security issues
==========================

- There is one problem with the widely existing implementation: it has a well known security issue;
- `Mozilla first to disable WebSockets`__ back in December 2010;
- `Actual issue is to do with the way transparent proxies can operate`__ as a man in the middle;

  - Two endpoints could communicate even if the proxy between didn't understand the protocol - the endpoints didn't reject the requests
  - Allows for caches to be poisoned as communication after first connection isn't verified

- `The paper which found the original attack`__ is in the long form of this talk;
- New version uses trivial encoding so it's obviously WebSockets communication (rather than just a broken looking HTTP 1.1 request)
- Encoding means proxies in between will let the traffic through. This has a double benefit of old broken proxies leaving your WebSockets unmolested;

__ http://hacks.mozilla.org/2010/12/websockets-disabled-in-firefox-4/
__ http://blog.pusherapp.com/2010/12/9/it-s-not-websockets-it-s-your-broken-proxy
__ http://www.adambarth.com/experimental/websocket.pdf

Future of WebSockets
====================

- As mentioned, the current spec is free of the proxy security issues mentioned above;
- The new version of Chromium, the open source browser that Chrome is built on, `supports the latest, secure version of the WebSockets protocol`__
- `A ticket was recently closed in Webkit`__ that adds support for the new protocol too;
- The Aurora alpha build of Firefox has `just added support for WebSockets`__ under a different DOM namespace
- IE will generally support Flash, which is great, and no one actually uses Opera, right?
- WebSockets *are* the best solution to having a real-time web application;

__ http://code.google.com/p/chromium/issues/detail?id=64470&q=websockets&sort=-modified&colspec=ID%20Stars%20Pri%20Area%20Feature%20Type%20Status%20Summary%20Modified%20Owner%20Mstone%20OS
__ https://bugs.webkit.org/show_bug.cgi?id=50099
__ http://hacks.mozilla.org/2011/05/aurora-6-is-here/

Server sent events
==================

- The other spec is `server sent events`__;
- Designed to replace foreveriframe and XHR multipart with server push;
- Not bidirectional like WebSockets - only server to client;
- Similar to XHR multipart but with less cruft and framing;
- Requires the same server design as XHR multipart;
- Only supported in IE10, Firefox 6;
- Current Safari and Chrome support it;
- By the the time it's mainstream Firefox will support WebSockets, leaving only IE to use this;
- Additional specification work for notifying offline browsers to reconnect, and sequential/numbered messages to ensure application in correct order;

__ http://dev.w3.org/html5/eventsource/

WebRTC
======

- Google, in conjunction with Mozilla and Opera, just announced `WebRTC`__
- Designed for in-browser real-time communication, potentially incorporating video and audio
- Built on top of existing protocols, making server and client adoption more likely
- Abstracts all other protocols to provide a consistent API for browser vendors and web-application authors

__ https://sites.google.com/site/webrtc/

Server architecture
===================

- Real time web goes two ways: server and client side
- Server side important to fulfil promise of client real time
- Nginx is an event-loop driven web server - it has a stable and predictable RAM profile under load

Apache and real time
====================

- I'm picking on Apache because it's the most popular web server on earth
- As mentioned before, Apache will just use up all its workers doing long polling
- PHP does have functions to access system level non-blocking stuff, but the only Google results on it are from 2006
- Just to make it clear I'm not picking on PHP: Rails and Django, out of the box, are blocking;
- Mitigation:

  - You might also need a message queue or other delivery mechanism;
  - Allows for regular threaded server and app models to post messages to asynchronous APIs;

    - Post database update, signal in model sends AMQP message notifying the exchange
    - Exchange fans out to WebSockets server to notify all interested parties
    - Interface updates

  - I recommend RabbitMQ, as it performs and scales very well;

Non-blocking servers
====================

- Special servers required, that perform asynchronously;
- Tornado is a quasi-famous example (open source Python web framework used by Friendfeed)
- As I said, if you're writing custom events or Ajax on the front end, you're already doing callback style evented programming
- Resource contention can still be an issue - if two asynchronous calls depend on the same resource, one of them can still block;
- Debugging can also be a problem, as it's not always clear which coroutine or callback is causing the error (stack traces are mangled);
- Take incoming request, route complexity to another function, move onto next request
- Requires different programming style, similar to custom events in Javascript - anything can fire or return at any time
- `Good overview of the issues faced`__
- I'm no expert in this kind of programming as far as low-level server interaction goes, so I can't explain the issues in depth. Hence I make no judgement as to the quality of the following libraries:

__ http://www.kegel.com/c10k.html

An example from Smarkets
========================

- I say "future" because this is the API we're moving towards
- We consider user experience and feel to be a core feature in the site, so we don't compromise on what the user experiences
- Basic flow

  - User pops "place bet" widget
  - Fills in fields, clicks "submit"
  - An Ajax ``POST`` fires off, and bet widget goes into "pending" (or spinning) state
  - Django parses request for form errors and authentication, then submits to API
  - API returns immediately with ``Ok``
  - Django sends appropriate response to Javascript, which remains spinning (but we know the request at least passed form validation)
  - API processes request asynchronously
  - When request is good and order accepted, a message is sent on the queue to the WebSockets frontend
  - Notification that order was accepted/rejected lands in browser, bet widget closes, new bet or error message displayed
  - Round trip of about 100ms, transactional (in the API code), but can handle 1000s of concurrent requests from API clients as well as customers of the website

- User never notices that it's asynchronous - to them it seems synchronous, which doesn't break their mental model of fill form, submit, response


Servers/libraries
=================

- Cometd implements the Bayeux protocol, and works with Jetty (Java);
- Tornado is the non-blocking Python web server used by Friendfeed. It impements non-blocking IO using callbacks. It has a socket.io implementation called Tornadio
- Eventlet is Linden Labs's (of Second Life fame) non-blocking evented Python framework. It uses a coroutine style. It has a WebSockets module for serving WebSockets;
- Twisted is a very complex networking and event library written in Python. I don't really understand it;

Message queues
==============

- TODO

Scaling
=======

- Offload complex processing to daemons
- Web server needs to be stateless

  - Build up session and state information on the server
  - Pass dynamic exchange bindings to web server
  - Web server just routes messages to client

- Use message queues to pass data around so nothing blocks

  - You can scale out by adding more web servers or more message queues
  - If the data gets more complex you can optimise the daemons or add more

- Let RabbitMQ do its thing and allow it to take the load
- High CPU is fine (that's what it's there for), as long as it's not pegged

Asynchronous programming
========================

- If you're working with Ajax or custom events in the browser, you're already doing it
- On the server, important not to block current request - this way it can go on to handle other requests while something churns away on the data required;
- For any complex operation an asynchronous API will be wanted, as you don't want to block the client. Blocking can lead to sluggish frontends and excessive RAM usage;

  - Asynchronous backends require a different programming paradigm - you need to program your Ajax and controllers to carry on until they receive a completion message;
  - Basic flow is make operation -> API returns -> Ajax carries on spinning -> completion message is sent -> Ajax notifies user that operation is complete. The difference here is that once the API has returned it can serve the next request while the other user hangs out and waits. In traditional CRUD operations the next request would be blocked. If the Ajax is done right the user will never know it wasn't in a single thread;
- Typically uses either callbacks or coroutines (callbacks are the Javascript way you're probably familiar with)

What can I use off the shelf?
=============================

At this point you might be terrified of all the details, but you have a few easy options for rolling out your own solutions.

- Node.js has the excellent `socket.io`__ client and server libraries, which wrap all the techniques described above for you in a convenient abstraction. I recommend the client library at the very least, as it does all the heavy lifting for you. Incidentally this presentation is running on node.js and uses socket.io to serve the real-time connection;

  - It's worth re-mentioning that the socket.io client library hides a lot of the JS and cross browser pain you'd otherwise have to go through;

- A commercial service like my office mates `Pusher`__, who provide a RESTful API to a WebSockets abstraction (with Flash fallback). This allows any service who is constrained to what they can install on their server to use real-time, albeit with the slight delay introduced by sending messages out to another service and then back to the browser;
- Polling is the final fallback. This is the least efficient and least performant variety of the techniques presented here, but it requires no special server or architecture and will work on top of whatever Ajax abstraction you're using.

__ http://socket.io/
__ http://pusher.com/

Accessibility
=============

I have included a few points on accessibility as a way of closing the loop - when I started in web development it was all about "doing it the right way". We're now in a world where it's considered cool to have tech demos which only run in Chrome, or to have entire website and URL structures based on just Javascript (hi Twitter!). As I still believe in doing things the right way, all potential users have to be considered.

Also, as we're now moving into an age where user experience is at the forefront of designers' and developers' minds, it's important to remember that experience should be optimised for every user possible.

- This is still a nascent part of the stack
- `ARIA live regions`__ can be used to specify how frequently, and how urgent, types of update are. It also controls if they need to know about the whole area, or specific parts;

  - ``aria-live`` attribute defines "polite" or "urgent" modes, which determine how insistent or quiet content updates are. The order these updates are read out is also determined by the value of this attribute. For example, updates to a public chatroom could be "polite", whereas private messages would be "urgent".
  - Updates sent to accessibility layers can be disabled while content loads with ``aria-busy``. Use this to block updates to a pane until all messages are processed and loaded. Note this can also be used for "loading" icons etc. while forms are being sent to the server;
  - ``aria-relevant`` can be used to indicate whether new child elements are important or not, and whether changes to text within the region are important

- ARIA roles are also important: a role of ``alert`` when they receive a new message or similar is appropriate, as this indicates that something has happened the user needs to know about. ``alertdialog`` can be used if the user needs to focus on the dialogue in question and action it (for example: a failed modal login dialogue)
- Be careful updating forms in-page because they can cause reloads in certain screenreaders
- Can be helpful to have an off-page area which has commentary - an example: "The price for Google has moved 5% downwards in the last 2 hours". This would normally be clearly indicated by the graph, but there's currently no easy way of updating either ``longdesc`` or providing ``alt`` attribute text for complex interaction;

__ http://www.w3.org/WAI/PF/aria-practices/#LiveRegions

To summarise
============

- Lots of new programming techniques on the server side here - the client continues as normal, assuming you have an abstraction for the various cross-browser things you have to do
- Can work cross browser if you're willing to do the work or use one of the solutions presented earlier
- Requires some thought when building our your own stack

  - How will you communicate that new things need to be seen?
  - What will you use on the server side?
  - Do you really need push, or would polling be appropriate?

- Worth looking into if your app or business requires it.

  - Smarkets customers asking for "refresh button", because our competitors do that
  - Adds real feeling of dynamism and speed to sites with frequent updates
  - Allows users to stay engaged and up to date without even focusing the tab

Questions?
==========

Gavin told me to expect questions. Let's have them!
