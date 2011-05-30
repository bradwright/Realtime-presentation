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
- Visit dibi2011.intranation.com
- This entire presentation *is* a real-time web application
- The slides on your screen sho

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

  - We detail the various hacks and ways that people have previously done push updates (why I use scare quotes around push will become clear)
  - We examine the pitfalls and benefits of each way

- The current (or upcoming, given it's all about as current as HTML 5 or CSS 3) standard:

  - Spoiler: it's WebSockets
  - There's another standard similar to long polling: Server Sent Events

- The elephant in the room:

  - There's a well-known security issue with the interaction between WebSockets and transparent proxies, which we'll talk about

Polling
=======

- Works with regular Ajax and setTimeout
- Doesn't require a special server
- Problems:
  - Excessive network latency from many HTTP requests
  - Data might not have changed between polls
- Best practice is to use If-Modified-Since and 304 responses to cut down on browser/network payload

Long-polling
============

- Basically server holds connection open until it has something to send
- Now we're at a new level of complexity

  - Need special kind of web server to handle this - Apache (or another standard prefork server) will just run out of workers
  - Need to queue messages while HTTP requests are being turned around
  - Still not entirely efficient

Comet
=====

- Comet is more formally known as "The Bayeux protocol"
- Combination of long-polling and JSONP polling
- Added handshake for some client/server verification
- Slightly complex, probably requires a custom Java server (and thus lots of XML)

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
