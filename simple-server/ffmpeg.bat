echo off

%1 mshta vbscript:CreateObject("Shell.Application").ShellExecute("cmd.exe","/c %~s0 ::","","runas",1)(window.close)&&exit

call ffmpeg -f gdigrab -i desktop -q 0 -f mpegts -codec:v mpeg1video -s 1280x720 -b:v 1500k -codec:a mp2 -ar 44100 -ac 1 -b:a 128k http://127.0.0.1:8890/jsmpeg