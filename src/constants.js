const TIPO_EVENTO = {
    Facturacion: 0
}

const TIPO_PERIODICIDAD = {
    Unico: 0,
    Diario: 1,
    Semanal: 2,
    Mensual: 3,
    Anual: 4
}

app.constant('TipoPeriodicidad', TIPO_PERIODICIDAD);
app.constant('TipoEvento', TIPO_EVENTO);