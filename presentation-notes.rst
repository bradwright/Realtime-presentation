Who am I?
=========

- Australian, where I worked for an agency making websites for many reputable brands
- Head of Web Development at betting exchange Smarkets, a London-based startup
- Web developer for 10 years, including two years at Yahoo! as a senior developer
- My background in this specific topic is that we've been doing various forms of real-time odds and sports data for a few years now. This talk is based on all the things I've learned, and also because there doesn't seem to be any definitive resource with this information

Overview
========

- These are the key points and areas I'll be going over during my talk, just so you're aware of the level I'm aiming at.
- I'm assuming most people have some experience with Ajax, since I'll be skipping that bit to focus on techniques that can mimic or provide server-pushed events to the browser

A short demo
============

- This is where we test out Gavin's claim that the wifi here would be
- Visit `dibi2011.intranation.com`__
- This entire presentation *is* a real-time web application
- The slides on your screen should keep up with mine as I advance

__ http://dibi2011.intranation.com/

What does "real time web programming" mean?
===========================================

Real world web examples
=======================

Non-web examples
================

Who really needs it?
====================

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

Forever iframe
==============

- Transferred via dynamic ``iframe``
- Uses ``connection: keep-alive`` and ``Transfer-encoding: chunked`` to serve chunks of content into the ``iframe``
- ``iframe`` inserts dynamic ``script`` elements that invoke a function in the parent window (like JSONP)
- Constantly loading in IE, which is a bad user experience, unless you use an (surprise!) ActiveXControl called ``htmlfile``;
- Google Talk team discovered this, `according to Dojo's Alex Russell`__

__ http://infrequently.org/2006/02/what-else-is-burried-down-in-the-depths-of-googles-amazing-javascript/

WebSockets
==========

- HTTP 1.1 headers
- Handshake for authentication (as it opens a socket)

Non-blocking libraries
======================

- Take incoming request, route complexity to another function, move onto next request
- Requires different programming style, similar to custom events in Javascript - anything can fire or return at any time
- Good overview of the issues faced: http://www.kegel.com/c10k.html
- I'm no expert in this kind of programming, so I can't explain the issues in depth. Hence I make no judgement as to the quality of the following libraries:



Servers/libraries
=================

- Cometd implements the Bayeux protocol, and works with Jetty (Java);
- Tornado is the non-blocking Python web server used by Friendfeed. It impements non-blocking IO using callbacks. It has a socket.io implementation called Tornadio
- Eventlet is Linden Labs's (of Second Life fame) non-blocking evented Python framework. It uses a coroutine style. It has a WebSockets module for serving WebSockets;
- Twisted is a very complex networking and event library written in Python. I don't really understand it;

Asynchronous programming
========================

- If you're working with Ajax or custom events in the browser, you're already doing it
- On the server, important not to block current request - this way it can go on to handle other requests while something churns away on the data required
- Typically uses either callbacks or coroutines (callbacks are the Javascript way you're probably familiar with)

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
