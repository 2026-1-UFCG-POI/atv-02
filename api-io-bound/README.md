# API de escrita em disco

API NestJS com um único endpoint, sem Redis: `POST /write?valor=20`.

```sh
bun install
bun run start:dev
```

```sh
# Sem parâmetro ou com valor vazio: grava 2^20 = 1048576 bytes
curl -X POST http://localhost:3000/write
curl -X POST 'http://localhost:3000/write?valor='

# Grava 2^20 = 1048576 bytes
curl -X POST 'http://localhost:3000/write?valor=20'
```

`valor` deve ser um inteiro não negativo, sem limite máximo configurado.
Ausente ou vazio, assume 20. Formatos inválidos retornam HTTP 400.
O tamanho é em bytes. O cálculo usa `Number`: expoentes muito grandes estão
sujeitos à precisão e ao overflow numérico do JavaScript.

Cada requisição cria um arquivo `.txt` com nome único em `data/`. A escrita é
assíncrona, em blocos de até 64 KiB, com conteúdo real (letra `a`). Após cada
bloco, a API aguarda `fsync` antes de escrever o próximo. Também aguarda o
fechamento do arquivo antes de responder. Isso produz uma carga de escrita
com sincronizações frequentes e pouco processamento de CPU.
Os arquivos são mantidos no disco; expoentes grandes exigem espaço correspondente.
Em caso de falha, a API retorna HTTP 500 e pode deixar um arquivo parcial.

A resposta HTTP 200 contém `requestId`, `value`, `sizeBytes` e `filePath`.
Também contém `blockSizeBytes`, `syncCount`, `writeMs`, `syncMs` e `durationMs`.
Os tempos são medidos na aplicação e incluem espera nas filas do runtime e
do sistema operacional; não são medidas isoladas da latência física do disco.
Há dois logs JSON na saída padrão: `request_received` ao receber a requisição e
`request_finished` antes da resposta, com o mesmo `requestId`, status e duração
em milissegundos. Requisições inválidas e falhas também geram ambos os logs.
O log final inclui os tempos de escrita e sincronização e o número de sincronizações.

## Controle da carga de I/O

| `valor`     | Bytes por requisição | Sincronizações por requisição |
| ----------- | -------------------- | ----------------------------- |
| 10          | 1 KiB                | 1                             |
| 20 (padrão) | 1 MiB                | 16                            |
| 24          | 16 MiB               | 256                           |
| 26          | 64 MiB               | 1024                          |

Cada incremento de `valor` dobra os bytes e, a partir de 16, também dobra
as sincronizações. A concorrência do gerador de carga controla quantas
requisições disputam o armazenamento ao mesmo tempo.

Para testar infraestrutura, configure `FILE_OUTPUT_DIR` no volume que deseja
avaliar, sem usar `tmpfs` ou um volume em RAM. O padrão 20 gera 1 MiB e 16 sincronizações;
use os valores da tabela para aumentar gradualmente a carga. Não há atraso
artificial nem cálculo intensivo para simular I/O.

A implementação favorece um gargalo de I/O, mas a confirmação exige medição:
observe throughput, p95/p99, CPU e latência/fila do armazenamento. Sob Node.js,
o pool de threads de filesystem também pode criar fila; registre a configuração
de `UV_THREADPOOL_SIZE` ao comparar ambientes. Um armazenamento que comprime
ou deduplica dados pode reduzir a carga física deste conteúdo repetitivo.
Os testes funcionais não demonstram saturação do armazenamento.

Configuração por variáveis de ambiente:

- `PORT`: porta HTTP (padrão `3000`).
- `FILE_OUTPUT_DIR`: diretório dos arquivos (padrão `data/`, relativo ao diretório de execução).

```sh
bun run build
bun run test
bun run test:e2e
bun run lint
```
