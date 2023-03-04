# Welcome to my personal website!

This is my first side project since I started my professional career on September 2021 (as a full-time Frontend Software Engineer)

Live at https://nguyenfromvn.github.io/

## Highlights:
- A music radio that can play music **uninterruptedly**, even when the network is slow or losing connection, or even if the screen is **off** or the device is **locked** (Android devices)
- Well performance optimizations including **dynamic fps limit**, using **custom code** instead of JavaScript builtin functions, **precise timing** for heavy tasks, using the **Performance tab** of Dev tools, etc. resulting in a very smooth experience with high framerate, even on mobile devices
- **Fault tolerance** crypto price tracking widget that can recover to work properly after an interruption event (caused by networking issues, etc.)
- **Precise** time info from the clock widget, it matches the system's time in **seconds**
- **No framework or library** involved, everything is written from scratch

## Features:
- A music radio with a long list of good songs
- Music visualization, emphasizing bass and treble 
- Creative and beautiful-looking design
- Good optimizations to deliver high framerate
- Crypto price tracking in real-time using **Binance WebSocket**
- Current weather info using **OpenWeatherMap API**
- A clock widget to show date and time
- A small game in the background where people can interact with the falling dots behind an invisible wall

## Notes:
- Users should consider using **Chrome** browser (on PC and mobile devices) for the best experience as most of the logic is implemented based on the documentation of Chrome
- Currently, browsers on iOS do get some restrictions, especially on audio playback and background stuff. I spent more than a week just to make sure the audio was played correctly on iOS. Still, the audio will stop immediately after the screen turns off or the user switches to another application
- Another known issue on iOS is about opening a new tab, iOS tends to block "pop-ups" and thus, opening new tabs may get banned and only can be done if the user does allow that
- Because audio is playing via a browser, not directly when compared to a native app, and thus, sometimes, the audio playback can be throttled or the tab can be even reloaded due to memory need for other purposes
