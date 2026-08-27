# Ativação do controle de descontos

Esta versão inclui uma Netlify Function e armazenamento persistente do Netlify para aplicar, por CPF:

- 10% apenas na primeira compra;
- 5% apenas na segunda compra;
- nenhum desconto a partir da terceira compra.

Os registros usam uma chave criptografada do CPF, sem armazenar o número do documento em texto aberto.

Para o recurso funcionar, publique este projeto por Git ou pelo Netlify CLI. O recurso de arrastar uma pasta publica apenas os arquivos estáticos e não ativa as Functions.

No Netlify, conecte esta pasta a um repositório Git e faça um novo deploy. O Netlify instalará `@netlify/blobs`, publicará `/.netlify/functions/discount` e criará o armazenamento persistente automaticamente.
