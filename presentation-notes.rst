Who am I?
=========

- Australian, where I worked for an agency making websites for many reputable brands
- Head of Web Development at betting exchange Smarkets, a London-based startup
- Web developer for 10 years, including two years at Yahoo! as a senior developer

Overview
========

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

- Cometd implements the Bayeux protocol, and works with Jetty (Java)
- Tornado is the non-blocking Python web server used by Friendfeed. It impements non-blocking IO using callbacks. It has a socket.io implementation called Tornadio
- Eventlet is Linden Labs's (of Second Life fame) non-blocking evented Python framework. It uses a coroutine style. It has a WebSockets module for serving WebSockets;
- Twisted is a very complex daemon and event library written in Python. I don't really understand it;
