```mermaid
stateDiagram-v2
    [*] --> Ideia
    Ideia --> Pesquisa : Iniciar pesquisa estrutural
    Pesquisa --> Escrita : Começar redação
    Escrita --> Revisao : Solicitar auditoria e validação
    Revisao --> Escrita : Encontrados vieses ou falhas
    Revisao --> Publicado : Aprovado (WCAG e Plain Language OK)
    Publicado --> [*]
```
