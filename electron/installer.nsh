!macro customCheckAppRunning
  nsExec::Exec 'taskkill /F /IM "IPTV Player Pro.exe" /T'
  nsExec::Exec 'taskkill /F /IM "iptvplayer.exe" /T'
  nsExec::Exec 'taskkill /F /IM "electron.exe" /T'
!macroend

!macro customInit
  nsExec::Exec 'taskkill /F /IM "IPTV Player Pro.exe" /T'
  nsExec::Exec 'taskkill /F /IM "iptvplayer.exe" /T'
!macroend

!macro customUnInit
  nsExec::Exec 'taskkill /F /IM "IPTV Player Pro.exe" /T'
  nsExec::Exec 'taskkill /F /IM "iptvplayer.exe" /T'
!macroend
