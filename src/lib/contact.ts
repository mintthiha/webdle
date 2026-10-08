/**
 * Who a prospect writes to, shared by the landing page and /contact/.
 *
 * `web3formsKey` is the public access key from web3forms.com (it is meant to sit in page source; it
 * can only send mail to the address it was created for). While it is empty, /contact/ shows the
 * email address alone and no form.
 */
export const contact = {
  name: 'Thiha Min Thein',
  email: 'mintthiha@gmail.com',
  web3formsKey: 'bfb8fcc8-1c33-418b-a511-6dff574e8337',
};

/** Roles offered on the form, in the order they appear. */
export const roles = ['Teacher', 'Writer', 'Something else'] as const;
