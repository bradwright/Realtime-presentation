Who am I?
=========

- Australian, where I worked for an agency making websites for many reputable brands. In case you're wanting to ask questions after the conference, I, like all Australians, don't drink Fosters.
- Head of Web Development at betting exchange Smarkets, a London-based startup
- Web developer for 10 years, including two years at Yahoo! as a senior developer
- My background in this specific topic is that we've been doing various forms of real-time odds and sports data for a few years now. This talk is based on all the things I've learned, and also because there doesn't seem to be any definitive resource with this information

Overview
========

- These are the key points and areas I'll be going over during my talk, just so you're aware of the level I'm aiming at.
- I'm assuming most people have some experience with Ajax, since I'll be skipping that bit to focus on techniques that can mimic or provide server-pushed events to the browser

A short demo
============

- This is where we test out Gavin's claim that "(t)he Sage Gateshead probably has the most rock-solid wifi/public internet connection in the entirety of the North East of England";
- Visit `dibi2011.intranation.com`__
- This entire presentation *is* a real-time web application
- The slides on your screen should keep up with mine as I advance (unless I broke it)

__ http://dibi2011.intranation.com/

What does "real time web programming" mean?
===========================================

Real world web examples
=======================

Non-web examples
================

Who really needs it?
====================

Why would I want it?
====================

In honesty, not all applications really need push updates. Here are a few ideas I came up with (I accept equity as thanks if any of these turn into successful businesses after this talk):

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

- As mentioned before, Apache will just use up all its workers doing long polling
- Special servers required, that perform asynchronously;
- You might also need a message queue or other delivery mechanism;
- Allows for regular threaded server and app models to post messages to asynchronous APIs;

  - Post database update, signal in model sends AMQP message notifying the exchange
  - Exchange fans out to WebSockets server to notify all interested parties

- I recommend RabbitMQ, as it performs and scales very well;
- TODO: basic explanation of queues and exchanges;

Non-blocking programming
========================

- Take incoming request, route complexity to another function, move onto next request
- Requires different programming style, similar to custom events in Javascript - anything can fire or return at any time
- `Good overview of the issues faced`__
- I'm no expert in this kind of programming as far as low-level server interaction goes, so I can't explain the issues in depth. Hence I make no judgement as to the quality of the following libraries:

__ http://www.kegel.com/c10k.html


Servers/libraries
=================

- Cometd implements the Bayeux protocol, and works with Jetty (Java);
- Tornado is the non-blocking Python web server used by Friendfeed. It impements non-blocking IO using callbacks. It has a socket.io implementation called Tornadio
- Eventlet is Linden Labs's (of Second Life fame) non-blocking evented Python framework. It uses a coroutine style. It has a WebSockets module for serving WebSockets;
- Twisted is a very complex networking and event library written in Python. I don't really understand it;

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
