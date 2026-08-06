export interface GroupMemberBalance {
  name: string;
  paid: number;
  // paid - perPersonShare; positive = the group owes this member, negative = this member owes the group
  balance: number;
}

export interface GroupCurrencySummary {
  currency: string;
  total: number;
  perPersonShare: number;
  members: GroupMemberBalance[];
}
