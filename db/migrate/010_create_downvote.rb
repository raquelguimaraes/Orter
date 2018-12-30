class CreateDownvote < ActiveRecord::Migration[5.1]
  def self.up
    create_table :downvotes do |t|
      t.references :point
      t.timestamps
    end
  end

  def self.down
    drop_table :downvotes
  end
end