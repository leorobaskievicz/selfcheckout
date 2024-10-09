#!/bin/bash

fileZip="self.zip"

if [ -f $fileZip ]; then
  echo "Arquivo $fileZip já existe."

  echo "1- Excluindo arquivo $fileZip antigo"

  rm -f $fileZip
fi

echo "2- Compactando arquivos para $fileZip"

cd ./release/build && zip -r "../../$fileZip" . && cd ../../

# lojas=("2" "3" "4" "5" "6" "7" "8" "9" "10" "11" "12" "13" "14" "15" "16" "17" "18" "19" "20" "21" "22" "23" "24" "25" "26" "27" "28" "29" "30" "31" "32" "33")

# for loja in "${lojas[@]}"; do
# echo "3- Atualizando: Loja $loja"
# ftp -n ftpspace.dnsalias.com <<END_SCRIPT
# quote USER ftp$loja
# quote PASS metron
# binary
# quote pasv
# delete ./envio/$fileZip
# put ./$fileZip ./envio/$fileZip
# quit
# END_SCRIPT
# echo "4- Concluído: Loja $loja"
# done
