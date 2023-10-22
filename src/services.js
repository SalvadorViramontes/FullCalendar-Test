var appServices = angular.module('testApp.services', []);

appServices.factory('testService', testService);
appServices.factory('eventService', eventService);

function testService(TipoPeriodicidad){
    var service = this;

    service.uuidv4 = function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    /**
     * @ngdoc service
     * @name nowDate
     * @kind function
     * 
     * @description
     * Calcula el timestamp de cuando se invoca el método y regresa un string con la fecha de hoy
     * 
     * @param {number} timezone El timezone expresado en minutos, vacío para tiempo local
     * @returns {string} fecha
     */
    service.nowDate = function(timezone) {
        var now = new Date();
        if(!timezone) timezone = -(new Date()).getTimezoneOffset();
        var utc_now = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds());
        var localms = utc_now.getTime() + timezone*60000;
        var localDate = new Date(localms);
        let result = service.toUTC(localDate);
        return result;
    }

    service.newHourDate = function(){
        let fecha = service.nowDate(-300);
        fecha.setHours(0);
        fecha.setMinutes(0);
        fecha.setSeconds(0);
        fecha.setMilliseconds(0);
        return fecha;
    }

    service.setHourInDate = function(date, hour){
        date.setHours(hour.getHours());
        date.setMinutes(hour.getMinutes());
        date.setSeconds(hour.getSeconds());
        date.setMilliseconds(hour.getMilliseconds());
        return date;
    }

    service.getHourInDate = function(date){
        let hour = new Date(date.getTime());
        hour.setHours(date.getHours());
        hour.setMinutes(date.getMinutes());
        hour.setSeconds(date.getSeconds());
        hour.setMilliseconds(date.getMilliseconds());
        return hour;
    }

    service.toUTC = function(date) {
        return new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    }

    service.fromUTC = function(date){
        return new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    }

    service.mapPeriodicity = function(periodicity) {
        let value = Number(periodicity);
        if(value === TipoPeriodicidad.Diario)
            return 'daily';
        else if(value === TipoPeriodicidad.Semanal)
            return 'weekly';
        else if(value === TipoPeriodicidad.Mensual)
            return 'monthly';
        else if(value === TipoPeriodicidad.Anual)
            return 'yearly';
        else
            return '';
    }

    return service;
}

function eventService($http, testService, TipoEvento, TipoPeriodicidad) {
    var service = this;
    let eventos = [];

    service.obtenEventos = function(){
        console.log(eventos);
    }
    
    service.nuevoEvento = function(eventInfo){
        let eventoServer = {
            id: testService.uuidv4(),
            tipoEvento: eventInfo.tipoEvento,
            tipoRepeticion: eventInfo.tipoRepeticion,
            fechaInicio: eventInfo.fechaInicio,
            fechaFin: eventInfo.fechaFin,
            hora: `${eventInfo.fechaInicio.getHours()}:${eventInfo.fechaInicio.getMinutes()}`,
            descripcion: eventInfo.descripcion
        };

        let eventoCalendar = service.nuevoEventoCalendar(eventInfo);

        eventos.push(eventoServer);
        service.obtenEventos();
        return eventoCalendar;
    }

    service.nuevoEventoCalendar = function(serverEvent){
        let rrule = null;
        if(Number(serverEvent.tipoRepeticion) !== TipoPeriodicidad.Unico)
            rrule = {
                freq: testService.mapPeriodicity(serverEvent.tipoRepeticion),
                dtstart: testService.toUTC(serverEvent.fechaInicio).toISOString().slice(0,19),
                until: testService.toUTC(serverEvent.fechaFin).toISOString().slice(0,19),
            }

        return {
            id: serverEvent.id,
            allDay: false,
            start: serverEvent.fechaInicio,
            end: serverEvent.fechaFin,
            title: serverEvent.descripcion,
            editable: true,
            extendedProps: {
                tipoEvento: serverEvent.tipoEvento,
                tipoRepeticion: serverEvent.tipoRepeticion
            },
            rrule
        }
    }

    service.editarEvento = function(eventInfo){
        let eventMap = eventos.map(evento => evento.id);
        let indexEvento = eventMap.indexOf(eventInfo.id);
        if(indexEvento > -1){
            let eventoEditable = eventos[indexEvento];
            eventoEditable.tipoEvento = eventInfo.tipoEvento;
            eventoEditable.tipoRepeticion = eventInfo.tipoRepeticion;
            eventoEditable.fechaInicio = eventInfo.fechaInicio;
            eventoEditable.fechaFin = eventInfo.fechaFin;
            eventoEditable.hora = `${eventInfo.fechaInicio.getHours()}:${eventInfo.fechaInicio.getMinutes()}`;
            eventoEditable.descripcion = eventInfo.descripcion;
            eventos[indexEvento] = eventoEditable;
        }
        service.obtenEventos();
        return true;
    }
    
    service.eliminarEvento = function(id){
        let eventMap = eventos.map(evento => evento.id);
        let indexEvento = eventMap.indexOf(id);
        if(indexEvento > -1){
            eventos.splice(indexEvento, 1);
        }
        service.obtenEventos();
        return true;
    }

    return service;
};