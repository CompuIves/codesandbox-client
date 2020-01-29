import { AsyncAction, Action } from 'app/overmind';
import { withLoadApp } from 'app/overmind/factories';
import { StripeErrorCode } from '@codesandbox/common/lib/types';

export const patronMounted: AsyncAction = withLoadApp();

export const priceChanged: Action<{ price: number }> = (
  { state },
  { price }
) => {
  state.patron.price = price;
};

export const createSubscriptionClicked: AsyncAction<{
  token: string;
  coupon: string;
  duration: 'yearly' | 'monthly';
}> = async ({ state, effects, actions }, { token, coupon, duration }) => {
  effects.analytics.track('Create Patron Subscription', { duration });
  state.patron.error = null;
  state.patron.isUpdatingSubscription = true;
  try {
    state.user = await effects.api.createPatronSubscription(
      token,
      state.patron.price,
      duration,
      coupon
    );
    effects.notificationToast.success('Thank you very much for your support!');
  } catch (error) {
    if (
      error.error_code &&
      error.error_code === StripeErrorCode.REQUIRES_ACTION
    ) {
      try {
        await effects.stripe.handleCardPayment(error.data.client_secret);
        state.user = await effects.api.getCurrentUser();
        state.patron.error = null;
      } catch (e) {
        actions.internal.handleError({
          message: 'Could not create subscription',
          error: e,
        });

        state.patron.error = e.message;

        effects.analytics.track('Create Subscription Error', {
          error: e.message,
        });
      }
    } else {
      actions.internal.handleError({
        message: 'Could not create subscription',
        error,
      });

      state.patron.error = error.message;

      effects.analytics.track('Create Subscription Error', {
        error: error.message,
      });
    }
  }
  state.patron.isUpdatingSubscription = false;
};

export const updateSubscriptionClicked: AsyncAction<{
  coupon: string;
}> = async ({ state, effects }, { coupon }) => {
  effects.analytics.track('Update Patron Subscription');
  state.patron.error = null;
  state.patron.isUpdatingSubscription = true;
  try {
    state.user = await effects.api.updatePatronSubscription(
      state.patron.price,
      coupon
    );
    effects.notificationToast.success(
      'Subscription updated, thanks for helping out!'
    );
  } catch (error) {
    state.patron.error = error.message;
  }
  state.patron.isUpdatingSubscription = false;
};

export const cancelSubscriptionClicked: AsyncAction = async ({
  state,
  effects,
}) => {
  effects.analytics.track('Cancel Subscription');
  if (
    effects.browser.confirm(
      'Are you sure you want to cancel your subscription?'
    )
  ) {
    state.patron.error = null;
    state.patron.isUpdatingSubscription = true;

    try {
      state.user = await effects.api.cancelPatronSubscription();
      effects.notificationToast.success(
        'Sorry to see you go, but thanks a bunch for the support this far!'
      );
    } catch (error) {
      /* ignore */
    }

    state.patron.isUpdatingSubscription = false;
  }
};

export const tryAgainClicked: Action = ({ state }) => {
  state.patron.error = null;
};
