# CrystalAR COD proxy — Cloudflare Worker

A busca arbitrária por COD ID não deve depender de proxies CORS públicos. Este Worker fornece uma rota controlada:

```text
GET /cif/1506803
```

Depois da implantação, defina antes de carregar `app.js`:

```html
<script>
  window.CRYSTALAR_PROXY_URL = "https://SEU-WORKER.workers.dev";
</script>
```

O Worker valida IDs, limita o tamanho da resposta, consulta somente servidores COD definidos, adiciona CORS apenas para o CrystalAR e usa cache de 24 horas.
