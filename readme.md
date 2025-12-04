# Mise en route du projet sur docker
```bash
docker compose up -d
```

# Test sur prometheus
http://localhost:9090

## Vérification des métrique
```
UP
```
## Résultat 
- Les services backend (user-service, order-service, payment-service et product-service) sont tous down.
## Cause 
Les services échouent avec l'erreur `Error: Invalid metric name` dans `prom-client`. Le problème vient de la configuration des métriques Prometheus.

Dans la const régister remplacer la ligne suivante :
```JS
client.collectDefaultMetrics({ register, prefix: `${SERVICE_NAME}_` });
```
Par
```JS
client.collectDefaultMetrics({ register, prefix: `${SERVICE_NAME.replace(/-/g, '_')}_` });
```
Puis répéter cela dans tout les autres services :
- services/order/server.js 
- services/product/server.js 
- services/payment/server.js 
- services/user/server.js 

Puis relancer les services :
```bash
docker-compose restart product-service order-service payment-service user-service
```
## Nouveau résultat 
Les métriques sont tous up.

# Taux de requêtes HTTP par seconde
```
rate(http_requests_total[5m])
```
## Résultat
- Les résultat sont normaux et corrects

# 
