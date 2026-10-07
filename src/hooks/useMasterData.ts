import { useQuery } from "@tanstack/react-query";
import { stationService } from "@/services/station.service";
import { trainService } from "@/services/train.service";
import { passengerService } from "@/services/passenger.service";
import { reservationService } from "@/services/reservation.service";

export const useActiveStations = () => useQuery({ queryKey: ["stations", "active"], queryFn: () => stationService.listActive() });
export const useTrains = () => useQuery({ queryKey: ["trains"], queryFn: () => trainService.list() });
export const useMyPassengers = () => useQuery({ queryKey: ["passengers", "mine"], queryFn: () => passengerService.listMine() });
export const useMyReservations = () => useQuery({ queryKey: ["reservations", "mine"], queryFn: () => reservationService.getUserReservations() });
