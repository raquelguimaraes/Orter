class Point < ActiveRecord::Base
  acts_as_soft_deletable

  belongs_to :section
  has_many :votes
  has_many :downvotes

  def votes_count
    votes.count - downvotes.count
  end
end
