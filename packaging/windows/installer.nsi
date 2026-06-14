; installer.nsi — installer NSIS per FAVELLA 1 (il linguaggio)
;
; Impacchetta la build PyInstaller one-dir (dist/favella1/) in un installer
; Windows con scorciatoie nel Menu Start e sul Desktop. La scorciatoia
; principale avvia il PLAYGROUND (editor + motore nel browser), pensata per
; l'autore non tecnico; chi usa la riga di comando trova `favella1.exe` nella
; cartella d'installazione.
;
; Build (dalla radice del repo, dopo `pyinstaller favella1.spec`):
;   makensis /DVERSION=0.28.1 packaging\windows\installer.nsi
; Produce: dist\favella1-setup-<VERSION>-windows-x64.exe

Unicode true
!include "MUI2.nsh"

!ifndef VERSION
  !define VERSION "0.0.0"
!endif

!define APPNAME "FAVELLA 1"
!define COMPANY "Simone Pizzi"
!define SOURCE_DIR "..\..\dist\favella1"
!define ICON "..\icons\favella1.ico"

Name "${APPNAME} ${VERSION}"
OutFile "..\..\dist\favella1-setup-${VERSION}-windows-x64.exe"
InstallDir "$PROGRAMFILES64\${APPNAME}"
InstallDirRegKey HKLM "Software\${APPNAME}" "InstallDir"
RequestExecutionLevel admin

!define MUI_ICON "${ICON}"
!define MUI_UNICON "${ICON}"
!define MUI_ABORTWARNING

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!define MUI_FINISHPAGE_RUN "$INSTDIR\favella1.exe"
!define MUI_FINISHPAGE_RUN_PARAMETERS "playground"
!define MUI_FINISHPAGE_RUN_TEXT "Apri subito il Playground di FAVELLA 1"
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "Italian"
!insertmacro MUI_LANGUAGE "English"

Section "FAVELLA 1" SecMain
  SectionIn RO
  SetOutPath "$INSTDIR"
  File /r "${SOURCE_DIR}\*.*"

  ; Scorciatoie nel Menu Start.
  CreateDirectory "$SMPROGRAMS\${APPNAME}"
  CreateShortcut "$SMPROGRAMS\${APPNAME}\FAVELLA 1 — Playground.lnk" \
    "$INSTDIR\favella1.exe" "playground" "$INSTDIR\favella1.exe" 0
  CreateShortcut "$SMPROGRAMS\${APPNAME}\Riga di comando FAVELLA.lnk" \
    "$SYSDIR\cmd.exe" '/K "cd /d \"$INSTDIR\""' "$SYSDIR\cmd.exe" 0
  CreateShortcut "$SMPROGRAMS\${APPNAME}\Disinstalla FAVELLA 1.lnk" \
    "$INSTDIR\uninstall.exe"

  ; Scorciatoia sul Desktop → Playground.
  CreateShortcut "$DESKTOP\FAVELLA 1 — Playground.lnk" \
    "$INSTDIR\favella1.exe" "playground" "$INSTDIR\favella1.exe" 0

  ; Registro: install dir + voce in "App e funzionalità".
  WriteRegStr HKLM "Software\${APPNAME}" "InstallDir" "$INSTDIR"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" \
    "DisplayName" "${APPNAME}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" \
    "DisplayVersion" "${VERSION}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" \
    "Publisher" "${COMPANY}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" \
    "DisplayIcon" "$INSTDIR\favella1.exe"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" \
    "UninstallString" "$INSTDIR\uninstall.exe"

  WriteUninstaller "$INSTDIR\uninstall.exe"
SectionEnd

Section "Uninstall"
  Delete "$DESKTOP\FAVELLA 1 — Playground.lnk"
  RMDir /r "$SMPROGRAMS\${APPNAME}"
  RMDir /r "$INSTDIR"
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}"
  DeleteRegKey HKLM "Software\${APPNAME}"
SectionEnd
