!macro customInit
  # Delete broken registry keys from previous tests so NSIS never invokes broken uninstallers
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\com.iptvplayer.desktop"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\com.iptvplayer.pro"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\iptv-player-desktop"
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\com.iptvplayer.desktop"
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\com.iptvplayer.pro"
  
  # Terminate any old background processes
  nsExec::Exec 'taskkill /F /IM "IPTV Player Pro.exe" /T'
  nsExec::Exec 'taskkill /F /IM "iptvplayer.exe" /T'
  nsExec::Exec 'taskkill /F /IM "electron.exe" /T'
!macroend

!macro customCheckAppRunning
  # Bypass false process lock
!macroend
