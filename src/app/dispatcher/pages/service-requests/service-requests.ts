import { Component } from '@angular/core';
import { SharedServiceRequestes } from '../../../Shared/shared-components/shared-service-requestes/shared-service-requestes';

@Component({
  selector: 'app-dispatcher-service-requests',
  standalone: true,
  imports: [SharedServiceRequestes],
  templateUrl: './service-requests.html',
  styleUrl: './service-requests.css'
})
export class ServiceRequests {

}
