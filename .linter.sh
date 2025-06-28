#!/bin/bash
cd /home/kavia/workspace/code-generation/tictacai-online-115279-fbd98dda/react_js_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

