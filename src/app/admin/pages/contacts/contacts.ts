import { Component } from '@angular/core';
import { SharedContacts } from '../../../Shared/shared-components/shared-contacts/shared-contacts';

@Component({
  selector: 'app-contacts',
  imports: [SharedContacts],
  templateUrl: './contacts.html',
  styleUrl: './contacts.css',
    standalone: true,
})
export class Contacts {

}