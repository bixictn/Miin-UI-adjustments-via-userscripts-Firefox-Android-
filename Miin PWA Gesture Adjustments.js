
篡改猴 by Jan Biniok
v5.5.0
	
Miin PWA Gesture Adjustments
by bixictn, Gemini, Chatgpt

1

// ==UserScript==

2

// @name   Miin PWA Gesture Adjustments

3

// @match  https://miin.cc/*

4

// @version   0.3.1

5

// @description  Miin PWA Gesture Adjustments

6

// @author       bixictn, Gemini, Chatgpt

7

// @grant  none

8

// @run-at    document-start

9

// @updateURL    https://raw.githubusercontent.com/bixictn/Miin-UI-adjustments-via-userscripts-Firefox-Android-/main/Miin%20PWA%20Gesture%20Adjustments.js

10

// @downloadURL  https://raw.githubusercontent.com/bixictn/Miin-UI-adjustments-via-userscripts-Firefox-Android-/main/Miin%20PWA%20Gesture%20Adjustments.js

11

// ==/UserScript==

12

​

13

(function () {

14

    'use strict';

15

​

16

    const TAG = "#pwa_guard";

17

    const SESSION_KEY = "pwa_guard_session_console.loged";

18

​

19

    let lastPath = location.pathname;

20

    let isDeployed = false;

21

    let closingByBack = false;

22

    let debug = true;

23

    let scrollHistory = {},targetScrollY = 0;

24

    let scale = 1;

25

    let handlescroll;

26

​

27

    const state = {

28

        isPageChange: false,

29

        isStartTouch: false

30

    };

31

​

32

    function log(...args) {

33

        if (debug) console.log(...args);

34

    }

35

​

36

    function deployGuard() {

37

​

38

        if (location.pathname !== "/feed/trend")return;

39

        if (location.hash.includes(TAG))return;

40

​

41

        const baseState = history.state || {};

42

        log("🛡️ Deploy Guard");

43

        history.replaceState({...baseState,pwa: "base"}, "", "/feed/trend");

44

​

